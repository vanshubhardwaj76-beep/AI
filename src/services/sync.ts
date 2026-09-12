import { getDatabase } from '@/database';
import { getSupabase } from './supabase';
import { useProfileStore } from '@/store/profileStore';
import { bootstrapStores } from '@/store/bootstrap';

/**
 * Cloud sync: stores a full JSON snapshot per user in a `user_backups` table
 * (columns: user_id uuid PK, snapshot jsonb, updated_at timestamptz).
 * Simple, robust and easy to reason about for a personal-data app.
 */
export const syncService = {
  async push(): Promise<{ ok: boolean; message: string }> {
    const sb = getSupabase();
    const uid = useProfileStore.getState().profile?.remoteUserId;
    if (!sb || !uid) return { ok: false, message: 'Sign in with a configured backend to sync.' };
    const db = await getDatabase();
    const snapshot = await db.exportAll();
    const { error } = await sb
      .from('user_backups')
      .upsert({ user_id: uid, snapshot, updated_at: new Date().toISOString() });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Backed up to the cloud.' };
  },

  async pull(): Promise<{ ok: boolean; message: string }> {
    const sb = getSupabase();
    const uid = useProfileStore.getState().profile?.remoteUserId;
    if (!sb || !uid) return { ok: false, message: 'Sign in with a configured backend to sync.' };
    const { data, error } = await sb.from('user_backups').select('snapshot').eq('user_id', uid).maybeSingle();
    if (error) return { ok: false, message: error.message };
    if (!data?.snapshot) return { ok: false, message: 'No cloud backup found yet.' };
    const db = await getDatabase();
    await db.importAll(data.snapshot);
    await bootstrapStores();
    return { ok: true, message: 'Restored from the cloud.' };
  },
};
