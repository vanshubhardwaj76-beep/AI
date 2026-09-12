import { create } from 'zustand';
import type { Goal, GoalCompletion } from '@/types';
import { getDatabase } from '@/database';
import { uid } from '@/utils/id';
import { todayKey } from '@/utils/date';
import { goalStreak, isGoalScheduledOn, overallStreak } from '@/utils/streaks';
import { rewardsFor } from '@/utils/leveling';
import { usePetStore } from './petStore';
import { useRewardStore } from './rewardStore';
import { useProfileStore } from './profileStore';
import { COMPLETION_CHEERS } from '@/data/prompts';

export type GoalInput = Omit<Goal, 'id' | 'createdAt' | 'archivedAt' | 'sortOrder' | 'paused'> & {
  paused?: boolean;
};

interface GoalState {
  goals: Goal[];
  completions: GoalCompletion[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (input: GoalInput) => Promise<Goal>;
  addMany: (inputs: GoalInput[]) => Promise<void>;
  update: (id: string, patch: Partial<Goal>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePause: (id: string) => Promise<void>;
  complete: (id: string, date?: string) => Promise<{ leveledUp: boolean } | null>;
  undo: (id: string, date?: string) => Promise<void>;
  isCompleted: (id: string, date?: string) => boolean;
  todaysGoals: () => Goal[];
  streakFor: (id: string) => number;
  overallStreak: () => number;
  reset: () => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  completions: [],
  loaded: false,

  load: async () => {
    const db = await getDatabase();
    const [goals, completions] = await Promise.all([
      db.collection<Goal>('goals').all(),
      db.collection<GoalCompletion>('completions').all(),
    ]);
    set({ goals: goals.sort((a, b) => a.sortOrder - b.sortOrder), completions, loaded: true });
  },

  add: async (input) => {
    const goal: Goal = {
      ...input,
      paused: input.paused ?? false,
      id: uid('goal_'),
      createdAt: new Date().toISOString(),
      archivedAt: null,
      sortOrder: get().goals.length,
    };
    set({ goals: [...get().goals, goal] });
    const db = await getDatabase();
    await db.collection<Goal>('goals').put(goal);
    return goal;
  },

  addMany: async (inputs) => {
    for (const i of inputs) await get().add(i);
  },

  update: async (id, patch) => {
    const goals = get().goals.map((g) => (g.id === id ? { ...g, ...patch } : g));
    set({ goals });
    const g = goals.find((x) => x.id === id);
    if (g) {
      const db = await getDatabase();
      await db.collection<Goal>('goals').put(g);
    }
  },

  remove: async (id) => {
    set({
      goals: get().goals.filter((g) => g.id !== id),
      completions: get().completions.filter((c) => c.goalId !== id),
    });
    const db = await getDatabase();
    await db.collection<Goal>('goals').remove(id);
    const comps = await db.collection<GoalCompletion>('completions').all();
    for (const c of comps.filter((c) => c.goalId === id)) {
      await db.collection<GoalCompletion>('completions').remove(c.id);
    }
  },

  togglePause: async (id) => {
    const g = get().goals.find((x) => x.id === id);
    if (g) await get().update(id, { paused: !g.paused });
  },

  isCompleted: (id, date = todayKey()) =>
    get().completions.some((c) => c.goalId === id && c.date === date),

  complete: async (id, date = todayKey()) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal || get().isCompleted(id, date)) return null;
    const streak = goalStreak(goal, get().completions) + 1;
    const reward = rewardsFor(goal.difficulty, streak);
    const completion: GoalCompletion = {
      id: uid('cmp_'),
      goalId: id,
      date,
      completedAt: new Date().toISOString(),
      xpAwarded: reward.xp,
      energyAwarded: reward.energy,
      coinsAwarded: reward.coins,
    };
    set({ completions: [...get().completions, completion] });
    const db = await getDatabase();
    await db.collection<GoalCompletion>('completions').put(completion);

    // Rewards go through the ledger: one transaction per completion, reversible on undo.
    const { tx, leveledUp, level } = await useRewardStore.getState().grant({
      source: 'goal', refId: completion.id, goalId: id, completionDate: date,
      xp: reward.xp, energy: reward.energy, coins: reward.coins, friendship: 1, streakBonus: reward.streakBonus,
    });
    const withTx = { ...completion, transactionId: tx.id };
    set({ completions: get().completions.map((c) => (c.id === completion.id ? withTx : c)) });
    await db.collection<GoalCompletion>('completions').put(withTx);

    const petStore = usePetStore.getState();
    petStore.triggerAnim(leveledUp ? 'levelup' : 'jump');
    petStore.showReaction(
      leveledUp
        ? { kind: 'levelup', title: `Level ${level}!`, subtitle: `${petStore.pet?.name ?? 'Your pet'} grew stronger`, xp: reward.xp, energy: reward.energy, coins: reward.coins, level }
        : { kind: 'goal', title: COMPLETION_CHEERS[Math.floor(Math.random() * COMPLETION_CHEERS.length)], subtitle: goal.name, xp: reward.xp, energy: reward.energy, coins: reward.coins },
    );
    return { leveledUp };
  },

  undo: async (id, date = todayKey()) => {
    const c = get().completions.find((x) => x.goalId === id && x.date === date);
    if (!c) return;
    set({ completions: get().completions.filter((x) => x.id !== c.id) });
    const db = await getDatabase();
    await db.collection<GoalCompletion>('completions').remove(c.id);
    // Reverse exactly the transaction created for THIS completion (and nothing else).
    const ledger = useRewardStore.getState();
    const reversed = c.transactionId ? await ledger.reverse(c.transactionId) : false;
    if (!reversed) {
      const n = await ledger.reverseByRef('goal', c.id);
      // Legacy completions (before the ledger existed) stored their own xp/energy;
      // coins were the difficulty's base amount (never streak-dependent).
      if (n === 0) {
        const legacyGoal = get().goals.find((g) => g.id === id);
        const coins = c.coinsAwarded ?? (legacyGoal ? rewardsFor(legacyGoal.difficulty, 1).coins : 0);
        await usePetStore.getState().loseXp(c.xpAwarded, c.energyAwarded, 0);
        if (coins) await useProfileStore.getState().addCoins(-coins);
      }
    }
  },

  todaysGoals: () => {
    const now = new Date();
    return get().goals.filter((g) => !g.paused && !g.archivedAt && isGoalScheduledOn(g, now));
  },

  streakFor: (id) => {
    const g = get().goals.find((x) => x.id === id);
    return g ? goalStreak(g, get().completions) : 0;
  },

  overallStreak: () => overallStreak(get().completions),

  reset: async () => {
    set({ goals: [], completions: [] });
    const db = await getDatabase();
    await db.collection('goals').clear();
    await db.collection('completions').clear();
  },
}));
