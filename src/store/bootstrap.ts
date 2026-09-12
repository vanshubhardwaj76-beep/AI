import { getDatabase } from '@/database';
import { useSettingsStore } from './settingsStore';
import { useProfileStore } from './profileStore';
import { usePetStore } from './petStore';
import { useGoalStore } from './goalStore';
import { useJournalStore } from './journalStore';
import { useMoodStore } from './moodStore';
import { useInventoryStore } from './inventoryStore';
import { useAdventureStore } from './adventureStore';
import { useActivityStore } from './activityStore';
import { useFriendStore } from './friendStore';

/** Load every store from persistent storage. Safe to call multiple times. */
export async function bootstrapStores() {
  await getDatabase();
  await Promise.all([
    useSettingsStore.getState().load(),
    useProfileStore.getState().load(),
    usePetStore.getState().load(),
    useGoalStore.getState().load(),
    useJournalStore.getState().load(),
    useMoodStore.getState().load(),
    useInventoryStore.getState().load(),
    useAdventureStore.getState().load(),
    useActivityStore.getState().load(),
    useFriendStore.getState().load(),
  ]);
}

/** Wipe all local data (used by "Delete account / Reset data"). */
export async function resetAllData() {
  const db = await getDatabase();
  await db.wipe();
  await Promise.all([
    useSettingsStore.getState().reset(),
    useProfileStore.getState().reset(),
    usePetStore.getState().reset(),
    useGoalStore.getState().reset(),
    useJournalStore.getState().reset(),
    useMoodStore.getState().reset(),
    useInventoryStore.getState().reset(),
    useAdventureStore.getState().reset(),
    useActivityStore.getState().reset(),
    useFriendStore.getState().reset(),
  ]);
  await useInventoryStore.getState().load();
}
