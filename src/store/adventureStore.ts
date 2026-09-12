import { create } from 'zustand';
import type { AdventureResult, AdventureRun } from '@/types';
import { getDatabase } from '@/database';
import { uid } from '@/utils/id';
import { adventureById } from '@/data/adventures';
import { usePetStore } from './petStore';
import { useProfileStore } from './profileStore';
import { useInventoryStore } from './inventoryStore';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

interface AdventureState {
  runs: AdventureRun[];
  load: () => Promise<void>;
  active: () => AdventureRun | undefined;
  start: (locationId: string) => Promise<{ ok: boolean; reason?: string }>;
  claim: (runId: string) => Promise<AdventureResult | null>;
  reset: () => Promise<void>;
}

export const useAdventureStore = create<AdventureState>((set, get) => ({
  runs: [],
  load: async () => {
    const db = await getDatabase();
    const runs = await db.collection<AdventureRun>('adventures').all();
    set({ runs: runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
  },
  active: () => get().runs.find((r) => !r.claimed),
  start: async (locationId) => {
    const loc = adventureById(locationId);
    if (!loc) return { ok: false, reason: 'Unknown location' };
    if (get().active()) return { ok: false, reason: 'Already on an adventure' };
    const pet = usePetStore.getState();
    if ((pet.pet?.level ?? 1) < loc.unlockLevel) return { ok: false, reason: `Unlocks at level ${loc.unlockLevel}` };
    const ok = await pet.spendEnergy(loc.energyCost);
    if (!ok) return { ok: false, reason: 'Not enough energy yet — complete a goal to recharge!' };
    const now = Date.now();
    const run: AdventureRun = {
      id: uid('adv_'),
      locationId,
      startedAt: new Date(now).toISOString(),
      endsAt: new Date(now + loc.durationMinutes * 60_000).toISOString(),
      claimed: false,
      result: null,
    };
    set({ runs: [run, ...get().runs] });
    const db = await getDatabase();
    await db.collection<AdventureRun>('adventures').put(run);
    return { ok: true };
  },
  claim: async (runId) => {
    const run = get().runs.find((r) => r.id === runId);
    const loc = run && adventureById(run.locationId);
    if (!run || !loc || run.claimed) return null;
    if (new Date(run.endsAt).getTime() > Date.now()) return null;

    const petName = usePetStore.getState().pet?.name ?? 'Your pet';
    const inv = useInventoryStore.getState();
    const story = loc.stories[rand(0, loc.stories.length - 1)].replace(/\{pet\}/g, petName);
    const xp = rand(loc.xpRange[0], loc.xpRange[1]);
    const coins = rand(loc.coinRange[0], loc.coinRange[1]);
    const itemIds: string[] = [];
    // 45% chance of an item drop the player doesn't own yet
    const candidates = loc.itemDrops.filter((i) => !inv.has(i));
    if (candidates.length && Math.random() < 0.45) itemIds.push(candidates[rand(0, candidates.length - 1)]);
    const collectible = loc.collectibleIds.find((c) => !inv.has(c)) ?? null;
    const collectibleId = collectible && Math.random() < 0.6 ? collectible : null;

    const result: AdventureResult = { xp, coins, itemIds, story, collectibleId };
    const updated: AdventureRun = { ...run, claimed: true, result };
    set({ runs: get().runs.map((r) => (r.id === runId ? updated : r)) });
    const db = await getDatabase();
    await db.collection<AdventureRun>('adventures').put(updated);

    for (const id of itemIds) await inv.grant(id, 'adventure');
    if (collectibleId) await inv.grant(collectibleId, 'adventure');
    await useProfileStore.getState().addCoins(coins);
    const pet = usePetStore.getState();
    const { leveledUp, level } = await pet.gainXp(xp, 0);
    await pet.bumpFriendship(3);
    pet.triggerAnim('jump');
    if (leveledUp) pet.showReaction({ kind: 'levelup', title: `Level ${level}!`, subtitle: 'Adventures make us stronger', level });
    return result;
  },
  reset: async () => {
    set({ runs: [] });
    const db = await getDatabase();
    await db.collection('adventures').clear();
  },
}));
