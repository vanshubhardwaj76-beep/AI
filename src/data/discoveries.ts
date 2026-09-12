import type { Discovery, DiscoveryKind } from '@/types';
import type { IconName } from '@/components/ui/Icon';

type Rarity = Discovery['rarity'];

interface CurioDef {
  name: string;
  description: string;
  rarity: Rarity;
  icon: IconName;
  color: string;
  kind?: DiscoveryKind;
  /** restrict to certain locations; omit for anywhere */
  where?: string[];
}

/** Original curios a pet might bring home. Weighted by rarity: common 60 / uncommon 30 / rare 10. */
export const CURIOS: CurioDef[] = [
  // anywhere
  { name: 'Pretty Stone', description: 'Smooth, speckled, and exactly palm sized.', rarity: 'common', icon: 'gem', color: '#B8A9E8' },
  { name: 'Tiny Souvenir', description: 'A very small thing from a very good day.', rarity: 'common', icon: 'gift', color: '#F5A3B5' },
  { name: 'Old Postcard', description: 'The handwriting is faded, but the sunset is not.', rarity: 'common', icon: 'mail', color: '#F4A261' },
  { name: 'Curly Feather', description: 'Dropped by someone in a hurry.', rarity: 'common', icon: 'feather', color: '#8EC5E8' },
  { name: 'Strange Little Plant', description: 'It leans toward whoever is talking.', rarity: 'uncommon', icon: 'leaf', color: '#4FA98B' },
  { name: 'Hidden Path', description: 'A shortcut only the patient can find.', rarity: 'uncommon', icon: 'map', color: '#6DBF9C', kind: 'landmark' },
  { name: 'Friendly Creature', description: 'It followed for a while, then waved goodbye.', rarity: 'uncommon', icon: 'snail', color: '#F9DC7A', kind: 'creature' },
  { name: 'Interesting Object', description: 'Nobody is sure what it does. It is definitely interesting.', rarity: 'uncommon', icon: 'puzzle', color: '#B8A9E8' },
  { name: 'Wishing Coin', description: 'Warm to the touch. Already used, probably.', rarity: 'rare', icon: 'coins', color: '#F4C24B' },
  { name: 'Map Fragment', description: 'Part of somewhere. Which part is a mystery.', rarity: 'rare', icon: 'map', color: '#C9B8A8', kind: 'landmark' },
  // forest
  { name: 'Mossy Pebble', description: 'Soft on one side, still warm from the sun.', rarity: 'common', icon: 'gem', color: '#6DBF9C', where: ['forest', 'ruins'] },
  { name: 'Glowing Mushroom Cap', description: 'It hums very quietly at night.', rarity: 'uncommon', icon: 'sparkle', color: '#8FD3B6', where: ['forest'] },
  { name: 'Secret Clearing', description: 'A circle of grass where the wind sings.', rarity: 'rare', icon: 'trees', color: '#4FA98B', where: ['forest'], kind: 'landmark' },
  // beach
  { name: 'Spiral Driftwood', description: 'Shaped by a thousand patient waves.', rarity: 'common', icon: 'waves', color: '#8EC5E8', where: ['beach'] },
  { name: 'Sea Glass', description: 'Frosted blue, softer than it looks.', rarity: 'uncommon', icon: 'gem', color: '#6FB6E0', where: ['beach'] },
  { name: 'Tide-Pool Friend', description: 'A tiny crab who insisted on a handshake.', rarity: 'rare', icon: 'snail', color: '#E76F51', where: ['beach'], kind: 'creature' },
  // mountains
  { name: 'Cloud in a Jar', description: 'Fluffy, but the lid must stay on.', rarity: 'uncommon', icon: 'cloud', color: '#E8EEF7', where: ['mountains'] },
  { name: 'Echo Stone', description: 'Say something kind; it says it back.', rarity: 'rare', icon: 'mountains', color: '#B8A9E8', where: ['mountains'] },
  // garden
  { name: 'Moon Petal', description: 'Glows faintly when the room is quiet.', rarity: 'uncommon', icon: 'garden', color: '#F5A3B5', where: ['garden'] },
  { name: 'Firefly Lantern', description: 'Empty now, but it remembers the light.', rarity: 'rare', icon: 'village', color: '#F9DC7A', where: ['garden'] },
  // village
  { name: 'Knitted Mitten', description: 'Just one. Someone is looking for the other.', rarity: 'common', icon: 'hand', color: '#E76F51', where: ['snow'] },
  { name: 'Paper Lantern', description: 'Folded by a baker with flour on her hands.', rarity: 'uncommon', icon: 'village', color: '#F4C24B', where: ['snow'] },
  // ruins
  { name: 'Carved Tile', description: 'A paw print pressed into clay long ago.', rarity: 'uncommon', icon: 'pet', color: '#C9B8A8', where: ['ruins'] },
  { name: 'Unread Story', description: 'A page that had been waiting for a reader.', rarity: 'rare', icon: 'journal', color: '#8E7CD1', where: ['ruins'], kind: 'story' },
  // space
  { name: 'Floaty Snack Wrapper', description: 'Proof of an excellent lunch.', rarity: 'common', icon: 'eat', color: '#F4A261', where: ['space'] },
  { name: 'Comet Dust', description: 'Sparkles when nobody is looking.', rarity: 'rare', icon: 'xp', color: '#8EC5E8', where: ['space'] },
];

/** Bonus stories – a location can draw from its own list plus these. */
export const GENERIC_STORIES = [
  'The path was unusually quiet today. {pet} followed a line of tiny footprints and found a spot where the light fell just right.',
  '{pet} took a wrong turn on purpose, just to see. It led to a bench with the best view of the sky.',
  'Halfway there, {pet} stopped to help a beetle flip back over. The beetle looked grateful, in a beetle sort of way.',
  '{pet} hummed the whole way. A bird joined in for the chorus.',
  'It rained a little. {pet} found shelter under a big leaf and listened until the drops turned to sunshine.',
  '{pet} made a small pile of interesting things, then chose only one to bring home for you.',
];

export const RARITY_WEIGHT: Record<Rarity, number> = { common: 60, uncommon: 30, rare: 10 };

export function curiosFor(locationId: string) {
  return CURIOS.filter((c) => !c.where || c.where.includes(locationId));
}
