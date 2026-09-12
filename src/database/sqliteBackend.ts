import * as SQLite from 'expo-sqlite';
import { COLLECTIONS, SCHEMA_VERSION } from './types';
import type { Collection, CollectionName, DatabaseSnapshot, Doc, KeyValueStore, StorageBackend } from './types';

/**
 * SQLite backend for iOS/Android. Each collection is a table with a JSON
 * document column – simple, transactional and fast enough for personal data.
 */
class SqliteCollection<T extends Doc> implements Collection<T> {
  constructor(
    private readonly db: SQLite.SQLiteDatabase,
    private readonly table: string,
  ) {}

  async all(): Promise<T[]> {
    const rows = await this.db.getAllAsync<{ data: string }>(`SELECT data FROM ${this.table}`);
    return rows.map((r) => JSON.parse(r.data) as T);
  }
  async get(id: string) {
    const row = await this.db.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${this.table} WHERE id = ?`,
      [id],
    );
    return row ? (JSON.parse(row.data) as T) : null;
  }
  async put(doc: T) {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO ${this.table} (id, data, updated_at) VALUES (?, ?, ?)`,
      [doc.id, JSON.stringify(doc), new Date().toISOString()],
    );
  }
  async putMany(docs: T[]) {
    await this.db.withTransactionAsync(async () => {
      for (const doc of docs) await this.put(doc);
    });
  }
  async remove(id: string) {
    await this.db.runAsync(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  }
  async clear() {
    await this.db.runAsync(`DELETE FROM ${this.table}`);
  }
}

export class SqliteBackend implements StorageBackend {
  readonly name = 'sqlite';
  private db!: SQLite.SQLiteDatabase;
  private cache = new Map<string, Collection<Doc>>();

  async init() {
    this.db = await SQLite.openDatabaseAsync('pipkin.db');
    await this.db.execAsync('PRAGMA journal_mode = WAL;');
    for (const c of COLLECTIONS) {
      await this.db.execAsync(
        `CREATE TABLE IF NOT EXISTS ${c} (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, updated_at TEXT);`,
      );
    }
    await this.db.execAsync(
      `CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
    );
  }

  collection<T extends Doc>(name: CollectionName): Collection<T> {
    if (!this.cache.has(name)) this.cache.set(name, new SqliteCollection<Doc>(this.db, name));
    return this.cache.get(name) as unknown as Collection<T>;
  }

  kv: KeyValueStore = {
    get: async <T,>(key: string) => {
      const row = await this.db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key]);
      return row ? (JSON.parse(row.value) as T) : null;
    },
    set: async <T,>(key: string, value: T) => {
      await this.db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
    },
    remove: async (key: string) => {
      await this.db.runAsync('DELETE FROM kv WHERE key = ?', [key]);
    },
  };

  async exportAll(): Promise<DatabaseSnapshot> {
    const collections = {} as Record<CollectionName, Doc[]>;
    for (const c of COLLECTIONS) collections[c] = await this.collection(c).all();
    const rows = await this.db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM kv');
    const kv: Record<string, unknown> = {};
    rows.forEach((r) => (kv[r.key] = JSON.parse(r.value)));
    return { version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), collections, kv };
  }

  async importAll(snapshot: DatabaseSnapshot) {
    await this.db.withTransactionAsync(async () => {
      for (const c of COLLECTIONS) {
        await this.db.runAsync(`DELETE FROM ${c}`);
        for (const doc of snapshot.collections[c] ?? []) {
          await this.db.runAsync(`INSERT INTO ${c} (id, data, updated_at) VALUES (?, ?, ?)`, [
            doc.id,
            JSON.stringify(doc),
            new Date().toISOString(),
          ]);
        }
      }
      await this.db.runAsync('DELETE FROM kv');
      for (const [k, v] of Object.entries(snapshot.kv)) {
        await this.db.runAsync('INSERT INTO kv (key, value) VALUES (?, ?)', [k, JSON.stringify(v)]);
      }
    });
  }

  async wipe() {
    await this.db.withTransactionAsync(async () => {
      for (const c of COLLECTIONS) await this.db.runAsync(`DELETE FROM ${c}`);
      await this.db.runAsync('DELETE FROM kv');
    });
  }
}
