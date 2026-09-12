import { COLLECTIONS, SCHEMA_VERSION } from './types';
import type { Collection, CollectionName, DatabaseSnapshot, Doc, KeyValueStore, StorageBackend } from './types';

/**
 * A persistence driver for the memory backend: load everything once, then
 * write-through on each mutation. Used by the web/AsyncStorage backend and by
 * tests (with a no-op driver).
 */
export interface PersistenceDriver {
  load(): Promise<{ collections: Partial<Record<string, Doc[]>>; kv: Record<string, unknown> }>;
  saveCollection(name: string, docs: Doc[]): Promise<void>;
  saveKv(kv: Record<string, unknown>): Promise<void>;
  clear(): Promise<void>;
}

export const noopDriver: PersistenceDriver = {
  async load() {
    return { collections: {}, kv: {} };
  },
  async saveCollection() {},
  async saveKv() {},
  async clear() {},
};

class MemoryCollection<T extends Doc> implements Collection<T> {
  constructor(
    private readonly name: string,
    private readonly map: Map<string, T>,
    private readonly persist: () => Promise<void>,
  ) {}

  async all() {
    return Array.from(this.map.values());
  }
  async get(id: string) {
    return this.map.get(id) ?? null;
  }
  async put(doc: T) {
    this.map.set(doc.id, doc);
    await this.persist();
  }
  async putMany(docs: T[]) {
    docs.forEach((d) => this.map.set(d.id, d));
    await this.persist();
  }
  async remove(id: string) {
    this.map.delete(id);
    await this.persist();
  }
  async clear() {
    this.map.clear();
    await this.persist();
  }
}

export class MemoryBackend implements StorageBackend {
  readonly name: string;
  private data = new Map<string, Map<string, Doc>>();
  private kvData: Record<string, unknown> = {};
  private collections = new Map<string, Collection<Doc>>();

  constructor(private readonly driver: PersistenceDriver = noopDriver, name = 'memory') {
    this.name = name;
  }

  async init() {
    const loaded = await this.driver.load();
    for (const c of COLLECTIONS) {
      const map = new Map<string, Doc>();
      (loaded.collections[c] ?? []).forEach((d) => map.set(d.id, d));
      this.data.set(c, map);
    }
    this.kvData = loaded.kv ?? {};
  }

  collection<T extends Doc>(name: CollectionName): Collection<T> {
    let existing = this.collections.get(name);
    if (!existing) {
      if (!this.data.has(name)) this.data.set(name, new Map());
      const map = this.data.get(name)! as Map<string, T>;
      existing = new MemoryCollection<T>(name, map, () =>
        this.driver.saveCollection(name, Array.from(map.values())),
      ) as unknown as Collection<Doc>;
      this.collections.set(name, existing);
    }
    return existing as unknown as Collection<T>;
  }

  kv: KeyValueStore = {
    get: async <T,>(key: string) => (this.kvData[key] as T | undefined) ?? null,
    set: async <T,>(key: string, value: T) => {
      this.kvData[key] = value;
      await this.driver.saveKv(this.kvData);
    },
    remove: async (key: string) => {
      delete this.kvData[key];
      await this.driver.saveKv(this.kvData);
    },
  };

  async exportAll(): Promise<DatabaseSnapshot> {
    const collections = {} as Record<CollectionName, Doc[]>;
    for (const c of COLLECTIONS) collections[c] = Array.from(this.data.get(c)?.values() ?? []);
    return { version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), collections, kv: { ...this.kvData } };
  }

  async importAll(snapshot: DatabaseSnapshot) {
    for (const c of COLLECTIONS) {
      const map = new Map<string, Doc>();
      (snapshot.collections[c] ?? []).forEach((d) => map.set(d.id, d));
      this.data.set(c, map);
      await this.driver.saveCollection(c, Array.from(map.values()));
    }
    this.kvData = { ...snapshot.kv };
    await this.driver.saveKv(this.kvData);
    this.collections.clear();
  }

  async wipe() {
    for (const c of COLLECTIONS) this.data.set(c, new Map());
    this.kvData = {};
    this.collections.clear();
    await this.driver.clear();
  }
}
