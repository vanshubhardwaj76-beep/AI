import { create } from 'zustand';
import type { GoalCategory, Profile } from '@/types';
import { getDatabase, KV_KEYS } from '@/database';
import { friendCode, uid } from '@/utils/id';

function newProfile(): Profile {
  return {
    id: uid('user_'),
    displayName: 'Friend',
    friendCode: friendCode(),
    coins: 20,
    focusAreas: [],
    improvementNote: '',
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
    authProvider: 'guest',
    email: null,
    remoteUserId: null,
  };
}

interface ProfileState {
  profile: Profile | null;
  load: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<void>;
  setFocusAreas: (areas: GoalCategory[]) => Promise<void>;
  addCoins: (n: number) => Promise<void>;
  spendCoins: (n: number) => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  load: async () => {
    const db = await getDatabase();
    let p = await db.kv.get<Profile>(KV_KEYS.profile);
    if (!p) {
      p = newProfile();
      await db.kv.set(KV_KEYS.profile, p);
    }
    set({ profile: p });
  },
  update: async (patch) => {
    const cur = get().profile ?? newProfile();
    const next = { ...cur, ...patch };
    set({ profile: next });
    const db = await getDatabase();
    await db.kv.set(KV_KEYS.profile, next);
  },
  setFocusAreas: (areas) => get().update({ focusAreas: areas }),
  addCoins: async (n) => {
    const cur = get().profile;
    if (!cur) return;
    await get().update({ coins: Math.max(0, cur.coins + n) });
  },
  spendCoins: async (n) => {
    const cur = get().profile;
    if (!cur || cur.coins < n) return false;
    await get().update({ coins: cur.coins - n });
    return true;
  },
  completeOnboarding: () => get().update({ onboardingComplete: true }),
  reset: async () => {
    const p = newProfile();
    set({ profile: p });
    const db = await getDatabase();
    await db.kv.set(KV_KEYS.profile, p);
  },
}));
