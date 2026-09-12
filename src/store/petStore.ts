import { create } from 'zustand';
import type { AccessorySlot, Pet, PetMood, PetSpecies } from '@/types';
import { getDatabase, KV_KEYS } from '@/database';
import { uid } from '@/utils/id';
import { levelFromXp, MAX_ENERGY } from '@/utils/leveling';
import { DEFAULT_ENVIRONMENT } from '@/data/items';

export interface Reaction {
  id: string;
  kind: 'goal' | 'levelup' | 'adventure' | 'activity' | 'mood' | 'pet';
  title: string;
  subtitle?: string;
  xp?: number;
  energy?: number;
  coins?: number;
  level?: number;
}

interface PetState {
  pet: Pet | null;
  /** transient */
  reaction: Reaction | null;
  animTrigger: { kind: 'happy' | 'jump' | 'sleep' | 'wave' | 'levelup'; at: number } | null;
  lastLevelUpAt: number;
  lastCompleteAt: number;
  load: () => Promise<void>;
  create: (species: PetSpecies, name: string) => Promise<void>;
  save: (patch: Partial<Pet>) => Promise<void>;
  rename: (name: string) => Promise<void>;
  /** returns whether a level-up happened */
  gainXp: (xp: number, energy?: number) => Promise<{ leveledUp: boolean; level: number }>;
  loseXp: (xp: number, energy?: number) => Promise<void>;
  spendEnergy: (n: number) => Promise<boolean>;
  bumpFriendship: (n: number) => Promise<void>;
  setMood: (mood: PetMood) => void;
  equip: (slot: AccessorySlot, itemId: string | null) => Promise<void>;
  setEnvironment: (id: string) => Promise<void>;
  touch: () => Promise<void>;
  showReaction: (r: Omit<Reaction, 'id'>) => void;
  clearReaction: () => void;
  triggerAnim: (kind: 'happy' | 'jump' | 'sleep' | 'wave' | 'levelup') => void;
  reset: () => Promise<void>;
}

export const usePetStore = create<PetState>((set, get) => ({
  pet: null,
  reaction: null,
  animTrigger: null,
  lastLevelUpAt: 0,
  lastCompleteAt: 0,

  load: async () => {
    const db = await getDatabase();
    const pet = await db.kv.get<Pet>(KV_KEYS.pet);
    set({ pet });
  },

  create: async (species, name) => {
    const now = new Date().toISOString();
    const pet: Pet = {
      id: uid('pet_'),
      name: name.trim(),
      species,
      xp: 0,
      level: 1,
      energy: 30,
      friendship: 10,
      mood: 'curious',
      equipped: {},
      environmentId: DEFAULT_ENVIRONMENT,
      createdAt: now,
      lastSeenAt: now,
    };
    set({ pet });
    const db = await getDatabase();
    await db.kv.set(KV_KEYS.pet, pet);
  },

  save: async (patch) => {
    const cur = get().pet;
    if (!cur) return;
    const next = { ...cur, ...patch };
    set({ pet: next });
    const db = await getDatabase();
    await db.kv.set(KV_KEYS.pet, next);
  },

  rename: (name) => get().save({ name: name.trim() }),

  gainXp: async (xp, energy = 0) => {
    const cur = get().pet;
    if (!cur) return { leveledUp: false, level: 1 };
    const totalXp = cur.xp + xp;
    const { level } = levelFromXp(totalXp);
    const leveledUp = level > cur.level;
    await get().save({
      xp: totalXp,
      level,
      energy: Math.min(MAX_ENERGY, cur.energy + energy),
      friendship: Math.min(100, cur.friendship + 1),
    });
    set({ lastCompleteAt: Date.now(), ...(leveledUp ? { lastLevelUpAt: Date.now() } : {}) });
    return { leveledUp, level };
  },

  loseXp: async (xp, energy = 0) => {
    const cur = get().pet;
    if (!cur) return;
    const totalXp = Math.max(0, cur.xp - xp);
    const { level } = levelFromXp(totalXp);
    await get().save({ xp: totalXp, level, energy: Math.max(0, cur.energy - energy) });
  },

  spendEnergy: async (n) => {
    const cur = get().pet;
    if (!cur || cur.energy < n) return false;
    await get().save({ energy: cur.energy - n });
    return true;
  },

  bumpFriendship: async (n) => {
    const cur = get().pet;
    if (!cur) return;
    await get().save({ friendship: Math.max(0, Math.min(100, cur.friendship + n)) });
  },

  setMood: (mood) => {
    const cur = get().pet;
    if (cur && cur.mood !== mood) set({ pet: { ...cur, mood } });
  },

  equip: async (slot, itemId) => {
    const cur = get().pet;
    if (!cur) return;
    const equipped = { ...cur.equipped };
    if (itemId) equipped[slot] = itemId;
    else delete equipped[slot];
    await get().save({ equipped });
  },

  setEnvironment: (id) => get().save({ environmentId: id }),

  touch: () => get().save({ lastSeenAt: new Date().toISOString() }),

  showReaction: (r) => set({ reaction: { ...r, id: uid('rx_') } }),
  clearReaction: () => set({ reaction: null }),
  triggerAnim: (kind) => set({ animTrigger: { kind, at: Date.now() } }),

  reset: async () => {
    set({ pet: null, reaction: null });
    const db = await getDatabase();
    await db.kv.remove(KV_KEYS.pet);
  },
}));
