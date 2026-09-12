import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalStreak, overallStreak, longestStreak, isGoalScheduledOn } from '@/utils/streaks';
import { toDateKey, addDays } from '@/utils/date';
import type { Goal, GoalCompletion } from '@/types';

const goal = (over: Partial<Goal> = {}): Goal => ({
  id: 'g1', name: 'Water', description: '', category: 'hydration', frequency: 'daily', days: [0, 1, 2, 3, 4, 5, 6],
  reminderTime: null, difficulty: 'easy', icon: 'water', color: '#000', paused: false, createdAt: '', archivedAt: null, sortOrder: 0, ...over,
});
const done = (goalId: string, daysAgo: number, today: Date): GoalCompletion => ({
  id: `${goalId}-${daysAgo}`, goalId, date: toDateKey(addDays(today, -daysAgo)), completedAt: '', xpAwarded: 10, energyAwarded: 10,
});

test('daily streak counts consecutive days incl. today', () => {
  const today = new Date(2026, 8, 12);
  const g = goal();
  assert.equal(goalStreak(g, [done('g1', 0, today), done('g1', 1, today), done('g1', 2, today)], today), 3);
});

test('streak is not lost before today is over', () => {
  const today = new Date(2026, 8, 12);
  const g = goal();
  assert.equal(goalStreak(g, [done('g1', 1, today), done('g1', 2, today)], today), 2);
  assert.equal(goalStreak(g, [done('g1', 2, today)], today), 0);
});

test('custom schedule skips unscheduled days', () => {
  const today = new Date(2026, 8, 12); // Saturday
  const g = goal({ frequency: 'custom', days: [1, 3, 5] }); // Mon Wed Fri
  assert.equal(isGoalScheduledOn(g, today), false);
  // Fri (1 day ago) + Wed (3 days ago) complete → streak 2
  assert.equal(goalStreak(g, [done('g1', 1, today), done('g1', 3, today)], today), 2);
});

test('weekly streak counts weeks', () => {
  const today = new Date(2026, 8, 12);
  const g = goal({ frequency: 'weekly' });
  assert.equal(goalStreak(g, [done('g1', 0, today), done('g1', 7, today), done('g1', 14, today)], today), 3);
});

test('overall + longest streak', () => {
  const today = new Date(2026, 8, 12);
  const c = [done('a', 0, today), done('b', 0, today), done('a', 1, today), done('a', 5, today), done('a', 6, today), done('a', 7, today)];
  assert.equal(overallStreak(c, today), 2);
  assert.equal(longestStreak(c), 3);
});
