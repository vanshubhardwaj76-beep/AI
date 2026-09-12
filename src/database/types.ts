export interface Doc {
  id: string;
}

export interface Collection<T extends Doc> {
  all(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  put(doc: T): Promise<void>;
  putMany(docs: T[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface StorageBackend {
  readonly name: string;
  init(): Promise<void>;
  collection<T extends Doc>(name: CollectionName): Collection<T>;
  kv: KeyValueStore;
  exportAll(): Promise<DatabaseSnapshot>;
  importAll(snapshot: DatabaseSnapshot): Promise<void>;
  wipe(): Promise<void>;
}

export const COLLECTIONS = [
  'goals',
  'completions',
  'journal',
  'moods',
  'adventures',
  'inventory',
  'activity_logs',
  'friends',
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

export interface DatabaseSnapshot {
  version: number;
  exportedAt: string;
  collections: Record<CollectionName, Doc[]>;
  kv: Record<string, unknown>;
}

export const KV_KEYS = {
  pet: 'pet',
  profile: 'profile',
  settings: 'settings',
  schemaVersion: 'schema_version',
} as const;

export const SCHEMA_VERSION = 1;
