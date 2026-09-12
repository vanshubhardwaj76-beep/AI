import { Platform } from 'react-native';
import { createAsyncStorageBackend } from './asyncStorageBackend';
import type { StorageBackend } from './types';

let backend: StorageBackend | null = null;
let initPromise: Promise<StorageBackend> | null = null;

async function createBackend(): Promise<StorageBackend> {
  if (Platform.OS !== 'web') {
    try {
      const { SqliteBackend } = await import('./sqliteBackend');
      const sqlite = new SqliteBackend();
      await sqlite.init();
      return sqlite;
    } catch (err) {
      console.warn('[db] SQLite unavailable, falling back to AsyncStorage', err);
    }
  }
  const fallback = createAsyncStorageBackend();
  await fallback.init();
  return fallback;
}

/** Returns the initialised storage backend (singleton). */
export function getDatabase(): Promise<StorageBackend> {
  if (backend) return Promise.resolve(backend);
  if (!initPromise) {
    initPromise = createBackend().then((b) => {
      backend = b;
      return b;
    });
  }
  return initPromise;
}

/** Testing hook: inject a backend. */
export function setDatabase(b: StorageBackend) {
  backend = b;
  initPromise = Promise.resolve(b);
}

export * from './types';
