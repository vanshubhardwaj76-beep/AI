// ---------- Pet ----------
export type PetSpecies = 'bird' | 'cat' | 'fox' | 'bunny' | 'penguin';

export type PetMood =
  | 'happy'
  | 'excited'
  | 'sleepy'
  | 'curious'
  | 'proud'
  | 'calm'
  | 'tired';

export type AccessorySlot = 'hat' | 'glasses' | 'scarf' | 'jacket' | 'backpack' | 'toy' | 'companion';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  xp: number;
  level: number;
  energy: number; // 0..maxEnergy, spent on adventures
  friendship: number; // 0..100
  mood: PetMood;
  equipped: Partial<Record<AccessorySlot, string>>; // itemId per slot
  environmentId: string;
  createdAt: string;
  lastSeenAt: string;
}

// ---------- Goals ----------
export type GoalCategory =
  | 'exercise'
  | 'sleep'
  | 'study'
  | 'hydration'
  | 'mindfulness'
  | 'productivity'
  | 'journaling'
  | 'routine'
  | 'custom';

export type GoalFrequency = 'daily' | 'weekly' | 'custom';
export type GoalDifficulty = 'easy' | 'medium' | 'hard';

export interface Goal {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  frequency: GoalFrequency;
  /** 0 = Sunday .. 6 = Saturday; used for custom schedules */
  days: number[];
  reminderTime: string | null; // "HH:mm"
  difficulty: GoalDifficulty;
  icon: string; // Ionicons name
  color: string;
  paused: boolean;
  createdAt: string;
  archivedAt: string | null;
  sortOrder: number;
}

export interface GoalCompletion {
  id: string;
  goalId: string;
  date: string; // YYYY-MM-DD
  completedAt: string;
  xpAwarded: number;
  energyAwarded: number;
}

// ---------- Journal ----------
export type JournalKind = 'daily' | 'gratitude' | 'mood' | 'free';

export interface JournalEntry {
  id: string;
  kind: JournalKind;
  title: string;
  body: string;
  prompt: string | null;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

// ---------- Mood ----------
export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  value: MoodValue;
  note: string;
  date: string;
  createdAt: string;
}

// ---------- Adventures ----------
export interface AdventureRun {
  id: string;
  locationId: string;
  startedAt: string;
  endsAt: string;
  claimed: boolean;
  /** result is set when claimed */
  result: AdventureResult | null;
}

export interface AdventureResult {
  xp: number;
  coins: number;
  itemIds: string[];
  story: string;
  collectibleId: string | null;
}

// ---------- Inventory / Items ----------
export type ItemKind = 'accessory' | 'environment' | 'collectible';

export interface Item {
  id: string;
  kind: ItemKind;
  slot?: AccessorySlot;
  name: string;
  description: string;
  price: number; // coins, 0 = unlock via level/adventure only
  unlockLevel: number;
  rarity: 'common' | 'rare' | 'epic';
  emoji: string;
  color: string;
}

export interface InventoryRecord {
  itemId: string;
  acquiredAt: string;
  source: 'shop' | 'adventure' | 'level' | 'gift';
}

// ---------- Activities ----------
export type ActivityCategory = 'breathing' | 'mindfulness' | 'reflection' | 'movement';

export interface ActivityStep {
  label: string;
  seconds: number;
}

export interface Activity {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  durationSeconds: number;
  icon: string;
  steps: ActivityStep[];
  loop?: boolean;
  xp: number;
  energy: number;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  date: string;
  completedAt: string;
}

// ---------- Friends ----------
export interface Friend {
  id: string;
  code: string;
  name: string;
  petName: string;
  species: PetSpecies;
  level: number;
  lastEncouragedAt: string | null;
  reactions: { emoji: string; at: string }[];
  addedAt: string;
}

// ---------- Settings / Profile ----------
export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  goalRemindersEnabled: boolean;
  adventureRemindersEnabled: boolean;
  breakRemindersEnabled: boolean;
  dailyReminderTime: string; // HH:mm
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  analyticsOptIn: boolean;
}

export interface Profile {
  id: string;
  displayName: string;
  friendCode: string;
  coins: number;
  focusAreas: GoalCategory[];
  improvementNote: string;
  onboardingComplete: boolean;
  createdAt: string;
  authProvider: 'guest' | 'email' | 'google';
  email: string | null;
  remoteUserId: string | null;
}

export type UUID = string;
