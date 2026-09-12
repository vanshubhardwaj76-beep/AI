import type { PetSpecies } from '@/types';

export interface SpeciesInfo {
  id: PetSpecies;
  name: string;
  tagline: string;
  personality: string;
  bodyColor: string;
  bellyColor: string;
  accentColor: string;
  defaultName: string;
}

export const SPECIES: SpeciesInfo[] = [
  {
    id: 'bird',
    name: 'Puffling',
    tagline: 'A round little songbird',
    personality: 'Cheerful and chatty, loves mornings.',
    bodyColor: '#F4A261',
    bellyColor: '#FFE8CF',
    accentColor: '#E76F51',
    defaultName: 'Pip',
  },
  {
    id: 'cat',
    name: 'Mochi Cat',
    tagline: 'A sleepy, soft kitty',
    personality: 'Calm and cozy, a great napping buddy.',
    bodyColor: '#B8A9E8',
    bellyColor: '#F1ECFF',
    accentColor: '#8E7CD1',
    defaultName: 'Momo',
  },
  {
    id: 'fox',
    name: 'Ember Fox',
    tagline: 'A curious forest fox',
    personality: 'Playful and clever, always exploring.',
    bodyColor: '#E9865A',
    bellyColor: '#FFF1E4',
    accentColor: '#C85C34',
    defaultName: 'Ember',
  },
  {
    id: 'bunny',
    name: 'Clover Bun',
    tagline: 'A gentle meadow bunny',
    personality: 'Sweet and encouraging, loves gardens.',
    bodyColor: '#F5A3B5',
    bellyColor: '#FFEFF3',
    accentColor: '#D97A91',
    defaultName: 'Clover',
  },
  {
    id: 'penguin',
    name: 'Pebble Penguin',
    tagline: 'A waddly ice buddy',
    personality: 'Loyal and steady, one step at a time.',
    bodyColor: '#5E6C8A',
    bellyColor: '#F4F7FF',
    accentColor: '#F9DC7A',
    defaultName: 'Pebble',
  },
];

export function speciesInfo(id: PetSpecies): SpeciesInfo {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0];
}
