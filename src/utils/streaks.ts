import type { Goal, GoalCompletion } from '@/types';
import { addDays, fromDateKey, toDateKey } from './date';

export function isGoalScheduledOn(goal: Goal, date: Date): boolean {
  if (goal.frequency === 'daily') return true;
  if (goal.frequency === 'weekly') return true; // any day of the week counts
  return goal.days.includes(date.getDay());
}

/**
 * Streak of consecutive scheduled days a goal was completed, counting back from
 * today. Today counts if complete; if not, we start counting from yesterday so
 * the streak isn't "lost" before the day is over.
 */
export function goalStreak(goal: Goal, completions: GoalCompletion[], today: Date = new Date()): number {
  const done = new Set(completions.filter((c) => c.goalId === goal.id).map((c) => c.date));
  if (goal.frequency === 'weekly') return weeklyStreak(done, today);

  let streak = 0;
  let cursor = new Date(today);
  const todayKey = toDateKey(today);
  if (!done.has(todayKey)) cursor = addDays(cursor, -1);
  for (let i = 0; i < 3650; i++) {
    if (!isGoalScheduledOn(goal, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    const key = toDateKey(cursor);
    if (done.has(key)) {
      streak++;
      cursor = addDays(cursor, -1);
    } else break;
  }
  return streak;
}

function weeklyStreak(done: Set<string>, today: Date): number {
  const weekKey = (d: Date) => {
    const s = new Date(d);
    s.setDate(s.getDate() - s.getDay());
    return toDateKey(s);
  };
  const weeks = new Set(Array.from(done).map((k) => weekKey(fromDateKey(k))));
  let streak = 0;
  let cursor = new Date(today);
  if (!weeks.has(weekKey(cursor))) cursor = addDays(cursor, -7);
  while (weeks.has(weekKey(cursor)) && streak < 1000) {
    streak++;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

/**
 * Overall streak: consecutive days (ending today or yesterday) with at least
 * one completion.
 */
export function overallStreak(completions: GoalCompletion[], today: Date = new Date()): number {
  const days = new Set(completions.map((c) => c.date));
  let streak = 0;
  let cursor = new Date(today);
  if (!days.has(toDateKey(cursor))) cursor = addDays(cursor, -1);
  while (days.has(toDateKey(cursor)) && streak < 10000) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(completions: GoalCompletion[]): number {
  const days = Array.from(new Set(completions.map((c) => c.date))).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of days) {
    const d = fromDateKey(key);
    if (prev && toDateKey(addDays(prev, 1)) === key) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
