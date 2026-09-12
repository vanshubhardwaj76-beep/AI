import { useMemo } from 'react';
import { useGoalStore } from '@/store/goalStore';
import { todayKey } from '@/utils/date';

export function useTodayProgress() {
  const goals = useGoalStore((s) => s.goals);
  const completions = useGoalStore((s) => s.completions);
  return useMemo(() => {
    const today = todayKey();
    const todays = useGoalStore.getState().todaysGoals();
    const done = todays.filter((g) => completions.some((c) => c.goalId === g.id && c.date === today));
    return {
      goals: todays,
      completed: done.length,
      total: todays.length,
      ratio: todays.length ? done.length / todays.length : 0,
      isDone: (id: string) => completions.some((c) => c.goalId === id && c.date === today),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, completions]);
}
