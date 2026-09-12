import type { Item } from '@/types';

export const ITEMS: Item[] = [
  // Hats
  { id: 'hat_beanie', kind: 'accessory', slot: 'hat', name: 'Cozy Beanie', description: 'Knitted with care.', price: 40, unlockLevel: 1, rarity: 'common', emoji: '🧶', color: '#E76F51' },
  { id: 'hat_flower', kind: 'accessory', slot: 'hat', name: 'Flower Crown', description: 'Fresh from the meadow.', price: 60, unlockLevel: 2, rarity: 'common', emoji: '🌸', color: '#F5A3B5' },
  { id: 'hat_wizard', kind: 'accessory', slot: 'hat', name: 'Star Hat', description: 'Slightly magical.', price: 120, unlockLevel: 5, rarity: 'rare', emoji: '⭐', color: '#B8A9E8' },
  { id: 'hat_crown', kind: 'accessory', slot: 'hat', name: 'Tiny Crown', description: 'For a very good friend.', price: 0, unlockLevel: 10, rarity: 'epic', emoji: '👑', color: '#F9DC7A' },
  // Glasses
  { id: 'glasses_round', kind: 'accessory', slot: 'glasses', name: 'Round Specs', description: 'For serious studying.', price: 50, unlockLevel: 1, rarity: 'common', emoji: '👓', color: '#4A3B32' },
  { id: 'glasses_sun', kind: 'accessory', slot: 'glasses', name: 'Sunnies', description: 'Beach ready.', price: 70, unlockLevel: 3, rarity: 'common', emoji: '🕶️', color: '#2A2640' },
  { id: 'glasses_heart', kind: 'accessory', slot: 'glasses', name: 'Heart Shades', description: 'Love the vibe.', price: 90, unlockLevel: 6, rarity: 'rare', emoji: '💗', color: '#F5A3B5' },
  // Scarves
  { id: 'scarf_red', kind: 'accessory', slot: 'scarf', name: 'Warm Scarf', description: 'Perfect for snow days.', price: 45, unlockLevel: 1, rarity: 'common', emoji: '🧣', color: '#E76F51' },
  { id: 'scarf_mint', kind: 'accessory', slot: 'scarf', name: 'Mint Scarf', description: 'Cool and calm.', price: 55, unlockLevel: 4, rarity: 'common', emoji: '🧣', color: '#8FD3B6' },
  { id: 'scarf_bow', kind: 'accessory', slot: 'scarf', name: 'Silk Bow', description: 'Fancy occasion.', price: 100, unlockLevel: 7, rarity: 'rare', emoji: '🎀', color: '#F5A3B5' },
  // Jackets
  { id: 'jacket_rain', kind: 'accessory', slot: 'jacket', name: 'Raincoat', description: 'Puddle approved.', price: 80, unlockLevel: 2, rarity: 'common', emoji: '🧥', color: '#F9DC7A' },
  { id: 'jacket_space', kind: 'accessory', slot: 'jacket', name: 'Space Suit', description: 'Zero gravity fit.', price: 0, unlockLevel: 8, rarity: 'epic', emoji: '🚀', color: '#8EC5E8' },
  // Backpacks
  { id: 'bag_explorer', kind: 'accessory', slot: 'backpack', name: 'Explorer Pack', description: 'Snacks included.', price: 65, unlockLevel: 2, rarity: 'common', emoji: '🎒', color: '#8FD3B6' },
  { id: 'bag_shell', kind: 'accessory', slot: 'backpack', name: 'Shell Pack', description: 'Found at the beach.', price: 0, unlockLevel: 3, rarity: 'rare', emoji: '🐚', color: '#F5A3B5' },
  // Toys
  { id: 'toy_ball', kind: 'accessory', slot: 'toy', name: 'Bouncy Ball', description: 'Endless fun.', price: 30, unlockLevel: 1, rarity: 'common', emoji: '⚾', color: '#E76F51' },
  { id: 'toy_kite', kind: 'accessory', slot: 'toy', name: 'Little Kite', description: 'Catches every breeze.', price: 75, unlockLevel: 4, rarity: 'rare', emoji: '🪁', color: '#8EC5E8' },
  // Companions
  { id: 'comp_snail', kind: 'accessory', slot: 'companion', name: 'Sunny the Snail', description: 'Slow and steady.', price: 0, unlockLevel: 4, rarity: 'rare', emoji: '🐌', color: '#F9DC7A' },
  { id: 'comp_duck', kind: 'accessory', slot: 'companion', name: 'Quill the Duck', description: 'Follows you everywhere.', price: 150, unlockLevel: 6, rarity: 'rare', emoji: '🦆', color: '#F9DC7A' },
  { id: 'comp_sprite', kind: 'accessory', slot: 'companion', name: 'Glow Sprite', description: 'A tiny light.', price: 0, unlockLevel: 12, rarity: 'epic', emoji: '✨', color: '#B8A9E8' },
  // Environments
  { id: 'env_bedroom', kind: 'environment', name: 'Cozy Bedroom', description: 'Home sweet home.', price: 0, unlockLevel: 1, rarity: 'common', emoji: '🛏️', color: '#FBE9D7' },
  { id: 'env_forest', kind: 'environment', name: 'Whispering Forest', description: 'Soft light through the trees.', price: 100, unlockLevel: 2, rarity: 'common', emoji: '🌲', color: '#8FD3B6' },
  { id: 'env_beach', kind: 'environment', name: 'Sunny Shore', description: 'Waves and warm sand.', price: 120, unlockLevel: 3, rarity: 'common', emoji: '🏖️', color: '#8EC5E8' },
  { id: 'env_cafe', kind: 'environment', name: 'Corner Café', description: 'Smells like cinnamon.', price: 160, unlockLevel: 5, rarity: 'rare', emoji: '☕', color: '#F4A261' },
  { id: 'env_cabin', kind: 'environment', name: 'Mountain Cabin', description: 'Fireplace crackling.', price: 200, unlockLevel: 7, rarity: 'rare', emoji: '🏔️', color: '#B8A9E8' },
  // Collectibles (adventure-only)
  { id: 'col_acorn', kind: 'collectible', name: 'Golden Acorn', description: 'Found in the forest.', price: 0, unlockLevel: 1, rarity: 'common', emoji: '🌰', color: '#C85C34' },
  { id: 'col_shell', kind: 'collectible', name: 'Spiral Shell', description: 'It hums with the sea.', price: 0, unlockLevel: 1, rarity: 'common', emoji: '🐚', color: '#F5A3B5' },
  { id: 'col_crystal', kind: 'collectible', name: 'Mountain Crystal', description: 'Cold and clear.', price: 0, unlockLevel: 1, rarity: 'rare', emoji: '💎', color: '#8EC5E8' },
  { id: 'col_star', kind: 'collectible', name: 'Star Fragment', description: 'Still faintly warm.', price: 0, unlockLevel: 1, rarity: 'epic', emoji: '🌟', color: '#F9DC7A' },
  { id: 'col_coin', kind: 'collectible', name: 'Ancient Coin', description: 'Engraved with a tiny paw.', price: 0, unlockLevel: 1, rarity: 'rare', emoji: '🪙', color: '#F4A261' },
  { id: 'col_snowglobe', kind: 'collectible', name: 'Snow Globe', description: 'A village inside.', price: 0, unlockLevel: 1, rarity: 'rare', emoji: '🔮', color: '#B8A9E8' },
  { id: 'col_seed', kind: 'collectible', name: 'Glowing Seed', description: 'Plant it somewhere kind.', price: 0, unlockLevel: 1, rarity: 'epic', emoji: '🌱', color: '#8FD3B6' },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);
export const DEFAULT_ENVIRONMENT = 'env_bedroom';
