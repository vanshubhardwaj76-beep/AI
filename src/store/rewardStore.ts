import { create } from 'zustand';
import type { RewardSource, RewardTransaction } from '@/types';
import { getDatabase } from '@/database';
import { uid } from '@/utils/id';
import { usePetStore } from './petStore';
import { useProfileStore } from './profileStore';
import { useInventoryStore } from './inventoryStore';

export interface GrantInput {
  source: RewardSource;
  refId: string;
  goalId?: string;
  completionDate?: string;
  xp?: number;
  energy?: number;
  coins?: number;
  friendship?: number;
  streakBonus?: number;
  itemIds?: string[];
}

export interface GrantOutcome {
  tx: RewardTransaction;
  leveledUp: boolean;
  level: number;
  /** true when a transaction for this refId already existed – nothing was granted again */
  duplicate: boolean;
}

interface RewardState {
  transactions: RewardTransaction[];
  load: () => Promise<void>;
  /**
   * Grant rewards exactly once per (source, refId). Calling it again with the
   * same refId returns the existing transaction and grants nothing.
   */
  grant: (input: GrantInput) => Promise<GrantOutcome>;
  /** Reverse a transaction exactly. Idempotent: a reversed tx is never reversed twice. */
  reverse: (txId: string) => Promise<boolean>;
  /** Reverse every active transaction attached to a refId (e.g. a completion id). */
  reverseByRef: (source: RewardSource, refId: string) => Promise<number>;
  find: (source: RewardSource, refId: string) => RewardTransaction | undefined;
  reset: () => Promise<void>;
}

// Serialise grants/reversals so rapid toggles can't interleave and double-apply.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const p = queue.then(fn, fn);
  queue = p.catch(() => undefined);
  return p;
}

export const useRewardStore = create<RewardState>((set, get) => ({
  transactions: [],

  load: async () => {
    const db = await getDatabase();
    set({ transactions: await db.collection<RewardTransaction>('reward_transactions').all() });
  },

  find: (source, refId) => get().transactions.find((t) => t.source === source && t.refId === refId && !t.reversedAt),

  grant: (input) =>
    enqueue(async () => {
      const existing = get().find(input.source, input.refId);
      const petStore = usePetStore.getState();
      if (existing) {
        return { tx: existing, duplicate: true, leveledUp: false, level: petStore.pet?.level ?? 1 };
      }
      const tx: RewardTransaction = {
        id: uid('tx_'),
        source: input.source,
        refId: input.refId,
        goalId: input.goalId,
        completionDate: input.completionDate,
        xp: input.xp ?? 0,
        energy: input.energy ?? 0,
        coins: input.coins ?? 0,
        friendship: input.friendship ?? 0,
        streakBonus: input.streakBonus ?? 0,
        itemIds: input.itemIds ?? [],
        createdAt: new Date().toISOString(),
        reversedAt: null,
      };
      // Persist the ledger entry FIRST so a crash mid-way can never grant twice.
      const db = await getDatabase();
      await db.collection<RewardTransaction>('reward_transactions').put(tx);
      set({ transactions: [...get().transactions, tx] });

      const { leveledUp, level, applied } = await petStore.gainXp(tx.xp, tx.energy, tx.friendship);
      if (tx.coins) await useProfileStore.getState().addCoins(tx.coins);
      // Store the *effective* deltas (energy/friendship are clamped) so reversal is exact.
      if (applied.xp !== tx.xp || applied.energy !== tx.energy || applied.friendship !== tx.friendship) {
        const effective: RewardTransaction = { ...tx, xp: applied.xp, energy: applied.energy, friendship: applied.friendship };
        await db.collection<RewardTransaction>('reward_transactions').put(effective);
        set({ transactions: get().transactions.map((t) => (t.id === tx.id ? effective : t)) });
        return { tx: effective, duplicate: false, leveledUp, level };
      }
      const inv = useInventoryStore.getState();
      for (const id of tx.itemIds) await inv.grant(id, input.source === 'adventure' ? 'adventure' : 'gift');
      return { tx, duplicate: false, leveledUp, level };
    }),

  reverse: (txId) =>
    enqueue(async () => {
      const tx = get().transactions.find((t) => t.id === txId);
      if (!tx || tx.reversedAt) return false;
      const reversed: RewardTransaction = { ...tx, reversedAt: new Date().toISOString() };
      const db = await getDatabase();
      await db.collection<RewardTransaction>('reward_transactions').put(reversed);
      set({ transactions: get().transactions.map((t) => (t.id === txId ? reversed : t)) });

      await usePetStore.getState().loseXp(tx.xp, tx.energy, tx.friendship);
      if (tx.coins) await useProfileStore.getState().addCoins(-tx.coins);
      // Items are intentionally NOT revoked (only goal rewards are reversible and never include items).
      return true;
    }),

  reverseByRef: async (source, refId) => {
    const txs = get().transactions.filter((t) => t.source === source && t.refId === refId && !t.reversedAt);
    let n = 0;
    for (const t of txs) if (await get().reverse(t.id)) n++;
    return n;
  },

  reset: async () => {
    set({ transactions: [] });
    const db = await getDatabase();
    await db.collection('reward_transactions').clear();
  },
}));
