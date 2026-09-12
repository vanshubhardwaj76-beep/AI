import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useGoalStore } from '@/store/goalStore';
import { usePetStore } from '@/store/petStore';
import { notificationService } from '@/services/notifications';

/** Re-schedules local notifications whenever settings or goals change. */
export function useNotificationSync() {
  const settings = useSettingsStore((s) => s.settings);
  const goals = useGoalStore((s) => s.goals);
  const petName = usePetStore((s) => s.pet?.name ?? 'Your pet');
  useEffect(() => {
    const t = setTimeout(() => {
      notificationService.syncSchedule(settings, goals, petName).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [settings, goals, petName]);
}
