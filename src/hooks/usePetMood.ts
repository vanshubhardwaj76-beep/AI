import { useEffect } from 'react';
import { usePetStore } from '@/store/petStore';
import { useGoalStore } from '@/store/goalStore';
import { computePetMood } from '@/utils/petMood';
import { todayKey } from '@/utils/date';

/** Keeps the pet's mood in sync with what's happening in the app. */
export function usePetMoodSync() {
  const pet = usePetStore((s) => s.pet);
  const lastCompleteAt = usePetStore((s) => s.lastCompleteAt);
  const lastLevelUpAt = usePetStore((s) => s.lastLevelUpAt);
  const goals = useGoalStore((s) => s.goals);
  const completions = useGoalStore((s) => s.completions);

  useEffect(() => {
    if (!pet) return;
    const compute = () => {
      const today = todayKey();
      const todays = useGoalStore.getState().todaysGoals();
      const completedToday = todays.filter((g) => completions.some((c) => c.goalId === g.id && c.date === today)).length;
      const now = Date.now();
      const mood = computePetMood({
        energy: pet.energy,
        completedToday,
        totalToday: todays.length,
        hoursSinceSeen: (now - new Date(pet.lastSeenAt).getTime()) / 36e5,
        hour: new Date().getHours(),
        recentlyCompleted: now - lastCompleteAt < 20_000,
        recentlyLeveled: now - lastLevelUpAt < 60_000,
      });
      usePetStore.getState().setMood(mood);
    };
    compute();
    const id = setInterval(compute, 15_000);
    return () => clearInterval(id);
  }, [pet?.energy, pet?.lastSeenAt, goals, completions, lastCompleteAt, lastLevelUpAt, pet]);
}
