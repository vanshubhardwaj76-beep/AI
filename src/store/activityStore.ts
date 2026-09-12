import { create } from 'zustand';
import type { ActivityLog } from '@/types';
import { getDatabase } from '@/database';
import { uid } from '@/utils/id';
import { todayKey } from '@/utils/date';
import { activityById } from '@/data/activities';
import { usePetStore } from './petStore';
import { useRewardStore } from './rewardStore';

interface ActivityState {
  logs: ActivityLog[];
  load: () => Promise<void>;
  complete: (activityId: string) => Promise<void>;
  reset: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  logs: [],
  load: async () => {
    const db = await getDatabase();
    set({ logs: await db.collection<ActivityLog>('activity_logs').all() });
  },
  complete: async (activityId) => {
    const act = activityById(activityId);
    if (!act) return;
    const log: ActivityLog = { id: uid('act_'), activityId, date: todayKey(), completedAt: new Date().toISOString() };
    set({ logs: [...get().logs, log] });
    const db = await getDatabase();
    await db.collection<ActivityLog>('activity_logs').put(log);
    const { leveledUp, level } = await useRewardStore.getState().grant({ source: 'activity', refId: log.id, xp: act.xp, energy: act.energy, friendship: 1 });
    const pet = usePetStore.getState();
    pet.triggerAnim(leveledUp ? 'levelup' : 'jump');
    pet.showReaction(
      leveledUp
        ? { kind: 'levelup', title: `Level ${level}!`, subtitle: act.title, xp: act.xp, energy: act.energy, level }
        : { kind: 'activity', title: 'Well done', subtitle: act.title, xp: act.xp, energy: act.energy },
    );
  },
  reset: async () => {
    set({ logs: [] });
    const db = await getDatabase();
    await db.collection('activity_logs').clear();
  },
}));
