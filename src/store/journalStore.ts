import { create } from 'zustand';
import type { JournalEntry, JournalKind } from '@/types';
import { getDatabase } from '@/database';
import { uid } from '@/utils/id';
import { todayKey } from '@/utils/date';
import { usePetStore } from './petStore';

interface JournalState {
  entries: JournalEntry[];
  load: () => Promise<void>;
  add: (input: { kind: JournalKind; title: string; body: string; prompt?: string | null; date?: string }) => Promise<JournalEntry>;
  update: (id: string, patch: Partial<Pick<JournalEntry, 'title' | 'body' | 'kind' | 'prompt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  search: (q: string) => JournalEntry[];
  byDate: (date: string) => JournalEntry[];
  reset: () => Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  load: async () => {
    const db = await getDatabase();
    const entries = await db.collection<JournalEntry>('journal').all();
    set({ entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  },
  add: async (input) => {
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      id: uid('jrn_'),
      kind: input.kind,
      title: input.title.trim(),
      body: input.body.trim(),
      prompt: input.prompt ?? null,
      date: input.date ?? todayKey(),
      createdAt: now,
      updatedAt: now,
    };
    set({ entries: [entry, ...get().entries] });
    const db = await getDatabase();
    await db.collection<JournalEntry>('journal').put(entry);
    // small reward for reflecting (first entry per day)
    const firstToday = get().entries.filter((e) => e.date === entry.date).length === 1;
    if (firstToday) {
      const pet = usePetStore.getState();
      await pet.gainXp(8, 5);
      pet.triggerAnim('happy');
      pet.showReaction({ kind: 'activity', title: 'Thanks for sharing', subtitle: 'Journal entry saved', xp: 8, energy: 5 });
    }
    return entry;
  },
  update: async (id, patch) => {
    const entries = get().entries.map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
    );
    set({ entries });
    const e = entries.find((x) => x.id === id);
    if (e) {
      const db = await getDatabase();
      await db.collection<JournalEntry>('journal').put(e);
    }
  },
  remove: async (id) => {
    set({ entries: get().entries.filter((e) => e.id !== id) });
    const db = await getDatabase();
    await db.collection<JournalEntry>('journal').remove(id);
  },
  search: (q) => {
    const s = q.trim().toLowerCase();
    if (!s) return get().entries;
    return get().entries.filter(
      (e) => e.title.toLowerCase().includes(s) || e.body.toLowerCase().includes(s) || (e.prompt ?? '').toLowerCase().includes(s),
    );
  },
  byDate: (date) => get().entries.filter((e) => e.date === date),
  reset: async () => {
    set({ entries: [] });
    const db = await getDatabase();
    await db.collection('journal').clear();
  },
}));
