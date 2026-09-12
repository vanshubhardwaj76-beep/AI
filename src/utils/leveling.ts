import type { GoalDifficulty } from '@/types';

export const MAX_ENERGY = 100;

/** XP required to go from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return Math.round(60 + (level - 1) * 40 + Math.pow(level - 1, 1.6) * 10);
}

export function levelFromXp(totalXp: number): { level: number; current: number; needed: number; progress: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level) && level < 99) {
    remaining -= xpForLevel(level);
    level++;
  }
  const needed = xpForLevel(level);
  return { level, current: remaining, needed, progress: Math.min(1, remaining / needed) };
}

export const DIFFICULTY_REWARDS: Record<GoalDifficulty, { xp: number; energy: number; coins: number }> = {
  easy: { xp: 10, energy: 10, coins: 3 },
  medium: { xp: 15, energy: 15, coins: 5 },
  hard: { xp: 25, energy: 20, coins: 8 },
};

export function rewardsFor(difficulty: GoalDifficulty, streak: number) {
  const base = DIFFICULTY_REWARDS[difficulty];
  // gentle streak bonus, capped so it never feels punishing to lose
  const bonus = Math.min(5, Math.floor(streak / 3));
  return { xp: base.xp + bonus, energy: base.energy, coins: base.coins, streakBonus: bonus };
}

export function levelTitle(level: number): string {
  if (level < 3) return 'Sprout';
  if (level < 6) return 'Explorer';
  if (level < 10) return 'Wanderer';
  if (level < 15) return 'Adventurer';
  if (level < 20) return 'Trailblazer';
  return 'Legend';
}
