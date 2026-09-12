import { create } from 'zustand';
import type { Friend, PetSpecies } from '@/types';
import { getDatabase } from '@/database';
import { uid } from '@/utils/id';
import { friendsService } from '@/services/friends';

interface FriendState {
  friends: Friend[];
  load: () => Promise<void>;
  addByCode: (code: string) => Promise<{ ok: boolean; reason?: string }>;
  remove: (id: string) => Promise<void>;
  encourage: (id: string, message: string) => Promise<void>;
  react: (id: string, emoji: string) => Promise<void>;
  reset: () => Promise<void>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  load: async () => {
    const db = await getDatabase();
    set({ friends: await db.collection<Friend>('friends').all() });
  },
  addByCode: async (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return { ok: false, reason: 'Friend codes are 6 letters/numbers' };
    if (get().friends.some((f) => f.code === code)) return { ok: false, reason: 'Already friends!' };
    const found = await friendsService.lookup(code);
    if (!found) return { ok: false, reason: 'No one found with that code' };
    const friend: Friend = {
      id: uid('frd_'),
      code,
      name: found.name,
      petName: found.petName,
      species: found.species as PetSpecies,
      level: found.level,
      lastEncouragedAt: null,
      reactions: [],
      addedAt: new Date().toISOString(),
    };
    set({ friends: [...get().friends, friend] });
    const db = await getDatabase();
    await db.collection<Friend>('friends').put(friend);
    return { ok: true };
  },
  remove: async (id) => {
    set({ friends: get().friends.filter((f) => f.id !== id) });
    const db = await getDatabase();
    await db.collection<Friend>('friends').remove(id);
  },
  encourage: async (id, message) => {
    const f = get().friends.find((x) => x.id === id);
    if (!f) return;
    await friendsService.sendEncouragement(f.code, message);
    const next = { ...f, lastEncouragedAt: new Date().toISOString() };
    set({ friends: get().friends.map((x) => (x.id === id ? next : x)) });
    const db = await getDatabase();
    await db.collection<Friend>('friends').put(next);
  },
  react: async (id, emoji) => {
    const f = get().friends.find((x) => x.id === id);
    if (!f) return;
    await friendsService.sendReaction(f.code, emoji);
    const next = { ...f, reactions: [{ emoji, at: new Date().toISOString() }, ...f.reactions].slice(0, 10) };
    set({ friends: get().friends.map((x) => (x.id === id ? next : x)) });
    const db = await getDatabase();
    await db.collection<Friend>('friends').put(next);
  },
  reset: async () => {
    set({ friends: [] });
    const db = await getDatabase();
    await db.collection('friends').clear();
  },
}));
