import { create } from 'zustand';
import type { InventoryRecord, Item } from '@/types';
import { getDatabase } from '@/database';
import { itemById, DEFAULT_ENVIRONMENT } from '@/data/items';
import { useProfileStore } from './profileStore';
import { usePetStore } from './petStore';

interface InventoryDoc extends InventoryRecord {
  id: string;
}

interface InventoryState {
  owned: InventoryRecord[];
  load: () => Promise<void>;
  has: (itemId: string) => boolean;
  grant: (itemId: string, source: InventoryRecord['source']) => Promise<boolean>;
  buy: (item: Item) => Promise<{ ok: boolean; reason?: string }>;
  reset: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  owned: [],
  load: async () => {
    const db = await getDatabase();
    const docs = await db.collection<InventoryDoc>('inventory').all();
    let owned: InventoryRecord[] = docs;
    if (!owned.some((o) => o.itemId === DEFAULT_ENVIRONMENT)) {
      const rec: InventoryDoc = { id: DEFAULT_ENVIRONMENT, itemId: DEFAULT_ENVIRONMENT, acquiredAt: new Date().toISOString(), source: 'level' };
      await db.collection<InventoryDoc>('inventory').put(rec);
      owned = [...owned, rec];
    }
    set({ owned });
  },
  has: (itemId) => get().owned.some((o) => o.itemId === itemId),
  grant: async (itemId, source) => {
    if (get().has(itemId) || !itemById(itemId)) return false;
    const rec: InventoryDoc = { id: itemId, itemId, acquiredAt: new Date().toISOString(), source };
    set({ owned: [...get().owned, rec] });
    const db = await getDatabase();
    await db.collection<InventoryDoc>('inventory').put(rec);
    return true;
  },
  buy: async (item) => {
    if (get().has(item.id)) return { ok: false, reason: 'Already owned' };
    const level = usePetStore.getState().pet?.level ?? 1;
    if (level < item.unlockLevel) return { ok: false, reason: `Unlocks at level ${item.unlockLevel}` };
    if (item.price === 0) return { ok: false, reason: 'Found on adventures' };
    const paid = await useProfileStore.getState().spendCoins(item.price);
    if (!paid) return { ok: false, reason: 'Not enough coins yet' };
    await get().grant(item.id, 'shop');
    return { ok: true };
  },
  reset: async () => {
    set({ owned: [] });
    const db = await getDatabase();
    await db.collection('inventory').clear();
  },
}));
