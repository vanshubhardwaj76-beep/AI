import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryBackend } from './memoryBackend';
import type { PersistenceDriver } from './memoryBackend';
import { COLLECTIONS } from './types';
import type { Doc } from './types';

const PREFIX = 'pipkin:';

const driver: PersistenceDriver = {
  async load() {
    const keys = [...COLLECTIONS.map((c) => PREFIX + 'col:' + c), PREFIX + 'kv'];
    const pairs = await AsyncStorage.multiGet(keys);
    const collections: Partial<Record<string, Doc[]>> = {};
    let kv: Record<string, unknown> = {};
    for (const [key, value] of pairs) {
      if (!value) continue;
      try {
        if (key === PREFIX + 'kv') kv = JSON.parse(value);
        else collections[key.replace(PREFIX + 'col:', '')] = JSON.parse(value);
      } catch {
        // corrupted value: skip it rather than crash the app
      }
    }
    return { collections, kv };
  },
  async saveCollection(name, docs) {
    await AsyncStorage.setItem(PREFIX + 'col:' + name, JSON.stringify(docs));
  },
  async saveKv(kv) {
    await AsyncStorage.setItem(PREFIX + 'kv', JSON.stringify(kv));
  },
  async clear() {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
  },
};

/** Used on web (and as a fallback if SQLite is unavailable). */
export function createAsyncStorageBackend() {
  return new MemoryBackend(driver, 'async-storage');
}
