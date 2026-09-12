import { create } from 'zustand';
import type { AdventurePhase, AdventureResult, AdventureRun, Discovery } from '@/types';
import { getDatabase } from '@/database';
import { uid } from '@/utils/id';
import { adventureById } from '@/data/adventures';
import { curiosFor, GENERIC_STORIES, RARITY_WEIGHT } from '@/data/discoveries';
import { itemById } from '@/data/items';
import { usePetStore } from './petStore';
import { useInventoryStore } from './inventoryStore';
import { useRewardStore } from './rewardStore';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const MIN = 60_000;

/** Adventure length: 6h–8h. Rest afterwards: 2h–4h. Overridable for tests / dev tools. */
export const ADVENTURE_MS = { min: 6 * 60 * MIN, max: 8 * 60 * MIN };
export const REST_MS = { min: 2 * 60 * MIN, max: 4 * 60 * MIN };

const iso = (ms: number) => new Date(ms).toISOString();
const ms = (s: string | null | undefined) => (s ? new Date(s).getTime() : NaN);

/** Pure: derive the phase of a run from its timestamps. */
export function phaseOf(run: AdventureRun | undefined, now = Date.now()): AdventurePhase {
  if (!run) return 'idle';
  if (!run.completedAt) return now < ms(run.endsAt) ? 'on_adventure' : 'on_adventure'; // completes on next sync
  if (!run.seenAt) return 'returned';
  if (run.restEndsAt && now < ms(run.restEndsAt)) return 'resting';
  return 'idle';
}

interface AdventureState {
  runs: AdventureRun[];
  /** bumped whenever sync changes something, so components re-render */
  tick: number;
  load: () => Promise<void>;
  /** The run that is currently "occupying" the pet (away, returned-unseen, or resting). */
  current: () => AdventureRun | undefined;
  /** @deprecated use current() */
  active: () => AdventureRun | undefined;
  phase: (now?: number) => AdventurePhase;
  start: (locationId: string, opts?: { durationMs?: number }) => Promise<{ ok: boolean; reason?: string; run?: AdventureRun }>;
  /**
   * Reconcile timestamps with reality: completes finished adventures exactly once
   * (generating rewards + discoveries and starting rest). Safe to call often.
   */
  sync: (now?: number) => Promise<AdventureRun | null>;
  /** Mark the welcome-home sequence as watched → enters RESTING. */
  markSeen: (runId: string) => Promise<void>;
  /** @deprecated legacy name – same as sync() for finished runs */
  claim: (runId: string) => Promise<AdventureResult | null>;
  reset: () => Promise<void>;
}

/** Upgrade records written before the state machine existed (they only had `claimed`). */
const normalise = (raw: AdventureRun): AdventureRun => {
  const r = raw as Partial<AdventureRun> & Pick<AdventureRun, 'id' | 'locationId' | 'startedAt' | 'endsAt' | 'claimed' | 'result'>;
  const legacy = !Object.prototype.hasOwnProperty.call(r, 'completedAt'); // pre-state-machine record: only had `claimed`
  return {
    ...r,
    completedAt: legacy ? (r.claimed ? r.startedAt : null) : r.completedAt ?? null,
    seenAt: legacy ? (r.claimed ? r.startedAt : null) : r.seenAt ?? null,
    restStartedAt: r.restStartedAt ?? null,
    restEndsAt: r.restEndsAt ?? null,
    result: r.result ? { ...r.result, discoveries: r.result.discoveries ?? [] } : null,
  };
};

let syncing: Promise<AdventureRun | null> | null = null;

export const useAdventureStore = create<AdventureState>((set, get) => ({
  runs: [],
  tick: 0,
  load: async () => {
    const db = await getDatabase();
    const runs = (await db.collection<AdventureRun>('adventures').all()).map(normalise);
    set({ runs: runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
    await get().sync();
  },
  current: () => {
    const now = Date.now();
    return get().runs.find((r) => phaseOf(r, now) !== 'idle');
  },
  active: () => get().current(),
  phase: (now = Date.now()) => phaseOf(get().current(), now),

  start: async (locationId, opts) => {
    await get().sync();
    const loc = adventureById(locationId);
    if (!loc) return { ok: false, reason: 'Unknown location' };
    const phase = get().phase();
    if (phase === 'on_adventure' || phase === 'returned') return { ok: false, reason: 'Already on an adventure' };
    if (phase === 'resting') return { ok: false, reason: 'Still resting from the last trip' };
    const pet = usePetStore.getState();
    if ((pet.pet?.level ?? 1) < loc.unlockLevel) return { ok: false, reason: `Unlocks at level ${loc.unlockLevel}` };
    const ok = await pet.spendEnergy(loc.energyCost);
    if (!ok) return { ok: false, reason: 'Not enough energy yet — complete a goal to recharge!' };
    const now = Date.now();
    const duration = opts?.durationMs ?? rand(ADVENTURE_MS.min, ADVENTURE_MS.max);
    const run: AdventureRun = {
      id: uid('adv_'),
      locationId,
      startedAt: iso(now),
      endsAt: iso(now + duration),
      completedAt: null,
      seenAt: null,
      restStartedAt: null,
      restEndsAt: null,
      claimed: false,
      result: null,
    };
    set({ runs: [run, ...get().runs], tick: get().tick + 1 });
    const db = await getDatabase();
    await db.collection<AdventureRun>('adventures').put(run);
    return { ok: true, run };
  },

  sync: (now = Date.now()) => {
    if (syncing) return syncing;
    const job = (async () => {
      const due = get().runs.find((r) => !r.completedAt && ms(r.endsAt) <= now);
      if (!due) return null;
      return completeRun(due, now, set, get);
    })();
    syncing = job;
    job.finally(() => { if (syncing === job) syncing = null; }).catch(() => undefined);
    return job;
  },

  markSeen: async (runId) => {
    const run = get().runs.find((r) => r.id === runId);
    if (!run || run.seenAt) return;
    const updated = { ...run, seenAt: iso(Date.now()) };
    set({ runs: get().runs.map((r) => (r.id === runId ? updated : r)), tick: get().tick + 1 });
    const db = await getDatabase();
    await db.collection<AdventureRun>('adventures').put(updated);
  },

  claim: async (runId) => {
    await get().sync();
    return get().runs.find((r) => r.id === runId)?.result ?? null;
  },

  reset: async () => {
    set({ runs: [], tick: 0 });
    const db = await getDatabase();
    await db.collection('adventures').clear();
  },
}));

function weightedCurio(locationId: string) {
  const pool = curiosFor(locationId);
  const total = pool.reduce((s, c) => s + RARITY_WEIGHT[c.rarity], 0);
  let roll = Math.random() * total;
  for (const c of pool) {
    roll -= RARITY_WEIGHT[c.rarity];
    if (roll <= 0) return c;
  }
  return pool[pool.length - 1];
}

async function completeRun(
  run: AdventureRun,
  now: number,
  set: (p: Partial<AdventureState>) => void,
  get: () => AdventureState,
): Promise<AdventureRun> {
  const loc = adventureById(run.locationId);
  const petName = usePetStore.getState().pet?.name ?? 'Your pet';
  const inv = useInventoryStore.getState();
  const stories = loc ? [...loc.stories, ...GENERIC_STORIES] : GENERIC_STORIES;
  const story = pick(stories).replace(/\{pet\}/g, petName);
  const xp = loc ? rand(loc.xpRange[0], loc.xpRange[1]) : 20;
  const coins = loc ? rand(loc.coinRange[0], loc.coinRange[1]) : 10;

  const discoveries: Discovery[] = [];
  // 1) always a curio (weighted common/uncommon/rare)
  const curio = weightedCurio(run.locationId);
  if (curio) {
    discoveries.push({ id: uid('dsc_'), kind: curio.kind ?? 'curio', name: curio.name, description: curio.description, rarity: curio.rarity, icon: curio.icon, color: curio.color });
  }
  // 2) coins
  discoveries.push({ id: uid('dsc_'), kind: 'coins', name: `${coins} coins`, description: 'Tucked away in a pocket for you.', rarity: coins >= 40 ? 'uncommon' : 'common', icon: 'coins', color: '#F4C24B', value: coins });
  // 3) maybe an item the player doesn't own yet (45%)
  const itemIds: string[] = [];
  const candidates = (loc?.itemDrops ?? []).filter((i) => !inv.has(i));
  if (candidates.length && Math.random() < 0.45) {
    const id = pick(candidates);
    itemIds.push(id);
    const item = itemById(id);
    discoveries.push({ id: uid('dsc_'), kind: 'item', name: item?.name ?? 'Mystery item', description: item?.description ?? 'A new thing to wear or keep.', rarity: 'uncommon', icon: (item?.icon as Discovery['icon']) ?? 'gift', color: '#B8A9E8', value: id });
  }
  // 4) maybe the location collectible (60%)
  const collectible = (loc?.collectibleIds ?? []).find((c) => !inv.has(c)) ?? null;
  const collectibleId = collectible && Math.random() < 0.6 ? collectible : null;
  if (collectibleId) {
    const item = itemById(collectibleId);
    itemIds.push(collectibleId);
    discoveries.push({ id: uid('dsc_'), kind: 'collectible', name: item?.name ?? 'Collectible', description: item?.description ?? 'A rare keepsake for the shelf.', rarity: 'rare', icon: (item?.icon as Discovery['icon']) ?? 'gem', color: '#8E7CD1', value: collectibleId });
  }

  // Grant through the ledger (idempotent on run.id) BEFORE marking the run complete.
  const { tx, leveledUp, level } = await useRewardStore.getState().grant({
    source: 'adventure', refId: run.id, xp, coins, friendship: 3, itemIds,
  });

  const restMs = rand(REST_MS.min, REST_MS.max);
  const result: AdventureResult = { xp, coins, itemIds, story, collectibleId, discoveries, transactionId: tx.id };
  const updated: AdventureRun = {
    ...run,
    completedAt: iso(now),
    claimed: true,
    restStartedAt: iso(now),
    restEndsAt: iso(now + restMs),
    result,
  };
  set({ runs: get().runs.map((r) => (r.id === run.id ? updated : r)), tick: get().tick + 1 });
  const db = await getDatabase();
  await db.collection<AdventureRun>('adventures').put(updated);

  if (leveledUp) {
    usePetStore.getState().showReaction({ kind: 'levelup', title: `Level ${level}!`, subtitle: 'Adventures make us stronger', level });
  }
  return updated;
}

/** Helpers for the UI. */
export function remainingMs(until: string | null | undefined, now = Date.now()) {
  return Math.max(0, ms(until) - now || 0);
}
export function progressOf(from: string | null | undefined, to: string | null | undefined, now = Date.now()) {
  const a = ms(from), b = ms(to);
  if (!a || !b || b <= a) return 1;
  return Math.min(1, Math.max(0, (now - a) / (b - a)));
}
export function formatDuration(msLeft: number) {
  const totalMin = Math.ceil(msLeft / MIN);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
