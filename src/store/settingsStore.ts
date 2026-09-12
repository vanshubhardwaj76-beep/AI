import { create } from 'zustand';
import type { Settings } from '@/types';
import { getDatabase, KV_KEYS } from '@/database';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  notificationsEnabled: false,
  goalRemindersEnabled: true,
  adventureRemindersEnabled: true,
  breakRemindersEnabled: false,
  dailyReminderTime: '09:00',
  soundEnabled: true,
  hapticsEnabled: true,
  analyticsOptIn: false,
};

interface SettingsState {
  settings: Settings;
  hydrated: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  load: async () => {
    const db = await getDatabase();
    const saved = await db.kv.get<Settings>(KV_KEYS.settings);
    set({ settings: { ...DEFAULT_SETTINGS, ...(saved ?? {}) }, hydrated: true });
  },
  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    const db = await getDatabase();
    await db.kv.set(KV_KEYS.settings, next);
  },
  reset: async () => {
    set({ settings: DEFAULT_SETTINGS });
    const db = await getDatabase();
    await db.kv.set(KV_KEYS.settings, DEFAULT_SETTINGS);
  },
}));
