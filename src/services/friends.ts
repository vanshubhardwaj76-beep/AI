import { getSupabase } from './supabase';
import type { PetSpecies } from '@/types';

export interface RemoteFriend {
  code: string;
  name: string;
  petName: string;
  species: PetSpecies;
  level: number;
}

/**
 * Friends service. With a backend this queries a `public_profiles` table
 * (friend_code, display_name, pet_name, species, level) and inserts into
 * `encouragements`. Without one, a few friendly sample companions are
 * available so the feature is fully explorable offline.
 */
const SAMPLE_FRIENDS: RemoteFriend[] = [
  { code: 'SUNNY1', name: 'Ada', petName: 'Waffles', species: 'penguin', level: 4 },
  { code: 'MOSSY2', name: 'Kai', petName: 'Juniper', species: 'fox', level: 7 },
  { code: 'CLOUD3', name: 'Ren', petName: 'Biscuit', species: 'bunny', level: 2 },
  { code: 'STARS4', name: 'Noor', petName: 'Comet', species: 'cat', level: 11 },
];

export const friendsService = {
  sampleCodes: SAMPLE_FRIENDS.map((f) => f.code),

  async lookup(code: string): Promise<RemoteFriend | null> {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb
        .from('public_profiles')
        .select('friend_code, display_name, pet_name, species, level')
        .eq('friend_code', code)
        .maybeSingle();
      if (data) {
        return { code: data.friend_code, name: data.display_name, petName: data.pet_name, species: data.species, level: data.level };
      }
    }
    return SAMPLE_FRIENDS.find((f) => f.code === code) ?? null;
  },

  async sendEncouragement(code: string, message: string) {
    const sb = getSupabase();
    if (sb) { try { await sb.from('encouragements').insert({ to_code: code, message }); } catch {} }
  },

  async sendReaction(code: string, emoji: string) {
    const sb = getSupabase();
    if (sb) { try { await sb.from('encouragements').insert({ to_code: code, message: emoji, kind: 'reaction' }); } catch {} }
  },
};
