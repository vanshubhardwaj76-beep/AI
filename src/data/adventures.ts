import type { IconName } from '@/components/ui/Icon';
export interface AdventureLocation {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  energyCost: number;
  durationMinutes: number;
  unlockLevel: number;
  xpRange: [number, number];
  coinRange: [number, number];
  collectibleIds: string[];
  itemDrops: string[];
  stories: string[];
}

export const ADVENTURES: AdventureLocation[] = [
  {
    id: 'forest', name: 'Whispering Forest', description: 'Soft moss, tall trees, and hidden acorns.', icon: 'forest', color: '#8FD3B6',
    energyCost: 25, durationMinutes: 10, unlockLevel: 1, xpRange: [20, 35], coinRange: [10, 20],
    collectibleIds: ['col_acorn'], itemDrops: ['toy_ball'],
    stories: [
      '{pet} followed a trail of glowing mushrooms and found a clearing where the wind hummed a lullaby.',
      'A family of hedgehogs invited {pet} to a picnic. {pet} shared a berry and made three new friends.',
      '{pet} climbed the oldest oak and watched the clouds drift by, feeling very small and very calm.',
    ],
  },
  {
    id: 'beach', name: 'Sunny Shore', description: 'Warm sand, gentle waves, sparkly shells.', icon: 'beach', color: '#8EC5E8',
    energyCost: 30, durationMinutes: 15, unlockLevel: 2, xpRange: [25, 45], coinRange: [15, 25],
    collectibleIds: ['col_shell'], itemDrops: ['bag_shell', 'glasses_sun'],
    stories: [
      '{pet} built a sandcastle with a moat. A crab moved in and declared itself mayor.',
      'The tide brought in a message in a bottle. It said: "You are doing better than you think."',
      '{pet} dozed off under a striped umbrella and dreamed of floating on a marshmallow.',
    ],
  },
  {
    id: 'mountains', name: 'Cloud Peaks', description: 'Crisp air and views that go forever.', icon: 'mountains', color: '#B8A9E8',
    energyCost: 40, durationMinutes: 25, unlockLevel: 3, xpRange: [35, 60], coinRange: [20, 35],
    collectibleIds: ['col_crystal'], itemDrops: ['scarf_red', 'hat_beanie'],
    stories: [
      '{pet} reached a ledge just as the sun broke through. Everything below glowed gold.',
      'A mountain goat taught {pet} how to balance on one hoof. {pet} mostly wobbled, but laughed a lot.',
      '{pet} found a crystal cave that sang when the wind passed through.',
    ],
  },
  {
    id: 'garden', name: 'Moonlit Garden', description: 'Flowers that glow softly after dark.', icon: 'garden', color: '#F5A3B5',
    energyCost: 35, durationMinutes: 20, unlockLevel: 4, xpRange: [30, 55], coinRange: [20, 30],
    collectibleIds: ['col_seed'], itemDrops: ['hat_flower', 'comp_snail'],
    stories: [
      '{pet} watered a shy little flower, and it bloomed a color nobody had a name for yet.',
      'Fireflies spelled out a tiny thank-you in the air above the lavender.',
      '{pet} planted a seed and whispered a wish to it. The garden keeps secrets well.',
    ],
  },
  {
    id: 'snow', name: 'Lantern Village', description: 'Snowy rooftops and warm windows.', icon: 'village', color: '#DDE6F5',
    energyCost: 45, durationMinutes: 30, unlockLevel: 5, xpRange: [40, 70], coinRange: [25, 40],
    collectibleIds: ['col_snowglobe'], itemDrops: ['scarf_mint', 'jacket_rain'],
    stories: [
      '{pet} helped light the evening lanterns. The whole village glowed like a warm hug.',
      'A baker gave {pet} a cinnamon bun still warm from the oven. Best. Day. Ever.',
      '{pet} made a snow-friend and gave it a very good scarf.',
    ],
  },
  {
    id: 'ruins', name: 'Mossy Ruins', description: 'Old stones with older stories.', icon: 'ruins', color: '#C9B8A8',
    energyCost: 50, durationMinutes: 40, unlockLevel: 7, xpRange: [55, 90], coinRange: [35, 55],
    collectibleIds: ['col_coin'], itemDrops: ['hat_wizard', 'glasses_round'],
    stories: [
      '{pet} traced carvings on a wall. They showed a small creature planting a tree that became a forest.',
      'A door opened to a library of stories that had never been read aloud. {pet} read one to a moth.',
      '{pet} found an ancient coin engraved with a paw print exactly {pet}-sized.',
    ],
  },
  {
    id: 'space', name: 'Star Station', description: 'Floaty snacks and a view of the whole world.', icon: 'space', color: '#5E6C8A',
    energyCost: 60, durationMinutes: 60, unlockLevel: 9, xpRange: [80, 130], coinRange: [50, 80],
    collectibleIds: ['col_star'], itemDrops: ['jacket_space', 'comp_sprite'],
    stories: [
      '{pet} watched a sunrise happen sixteen times in one day and cheered every time.',
      'Zero gravity made {pet}\'s ears float. {pet} decided this was the best feeling in the universe.',
      '{pet} caught a star fragment in a jar and promised to keep it safe for you.',
    ],
  },
];

export const adventureById = (id: string) => ADVENTURES.find((a) => a.id === id);
