import { create } from 'zustand';
import type { MoodEntry, MoodValue } from '@/types';
import { getDatabase } from '@/database';
import { uid } from '@/utils/id';
import { todayKey } from '@/utils/date';
import { usePetStore } from './petStore';
import { useRewardStore } from './rewardStore';

interface MoodState {
  entries: MoodEntry[];
  load: () => Promise<void>;
  checkIn: (value: MoodValue, note?: string) => Promise<MoodEntry>;
  remove: (id: string) => Promise<void>;
  todays: () => MoodEntry | undefined;
  byDate: (date: string) => MoodEntry | undefined;
  reset: () => Promise<void>;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  entries: [],
  load: async () => {
    const db = await getDatabase();
    const entries = await db.collection<MoodEntry>('moods').all();
    set({ entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  },
  checkIn: async (value, note = '') => {
    const date = todayKey();
    const existing = get().entries.find((e) => e.date === date);
    const entry: MoodEntry = {
      id: existing?.id ?? uid('mood_'),
      value,
      note: note.trim(),
      date,
      createdAt: new Date().toISOString(),
    };
    set({ entries: [entry, ...get().entries.filter((e) => e.id !== entry.id)] });
    const db = await getDatabase();
    await db.collection<MoodEntry>('moods').put(entry);
    if (!existing) {
      await useRewardStore.getState().grant({ source: 'mood', refId: entry.id, xp: 5, energy: 5, friendship: 1 });
      usePetStore.getState().triggerAnim('wave');
    }
    return entry;
  },
  remove: async (id) => {
    set({ entries: get().entries.filter((e) => e.id !== id) });
    const db = await getDatabase();
    await db.collection<MoodEntry>('moods').remove(id);
  },
  todays: () => get().entries.find((e) => e.date === todayKey()),
  byDate: (date) => get().entries.find((e) => e.date === date),
  reset: async () => {
    set({ entries: [] });
    const db = await getDatabase();
    await db.collection('moods').clear();
  },
}));
