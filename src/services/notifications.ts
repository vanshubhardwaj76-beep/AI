import { Platform } from 'react-native';
import type { Goal, Settings } from '@/types';

/**
 * Local notification scheduling. Wrapped so the rest of the app never imports
 * expo-notifications directly (it is unavailable on web and in Expo Go on
 * Android SDK 53+ for remote pushes; local notifications still work in dev builds).
 */
async function getModule() {
  if (Platform.OS === 'web') return null;
  try {
    const N = await import('expo-notifications');
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return N;
  } catch {
    return null;
  }
}

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    const N = await getModule();
    if (!N) return false;
    const { status } = await N.getPermissionsAsync();
    if (status === 'granted') return true;
    const res = await N.requestPermissionsAsync();
    return res.status === 'granted';
  },

  /** Re-schedule everything from current settings + goals. Idempotent. */
  async syncSchedule(settings: Settings, goals: Goal[], petName: string) {
    const N = await getModule();
    if (!N) return;
    await N.cancelAllScheduledNotificationsAsync();
    if (!settings.notificationsEnabled) return;

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'Reminders',
        importance: N.AndroidImportance.DEFAULT,
      });
    }

    const daily = (hhmm: string) => {
      const [hour, minute] = hhmm.split(':').map(Number);
      return { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute } as const;
    };

    if (settings.goalRemindersEnabled) {
      await N.scheduleNotificationAsync({
        content: { title: 'Time for your daily goals!', body: `${petName} is cheering you on.` },
        trigger: daily(settings.dailyReminderTime),
      });
      for (const g of goals.filter((g) => g.reminderTime && !g.paused && !g.archivedAt)) {
        await N.scheduleNotificationAsync({
          content: { title: g.name, body: g.description || 'A small step counts.' },
          trigger: daily(g.reminderTime!),
        });
      }
    }
    if (settings.adventureRemindersEnabled) {
      await N.scheduleNotificationAsync({
        content: { title: `${petName} has an adventure waiting!`, body: 'Complete a goal to earn energy for the trip.' },
        trigger: daily('18:00'),
      });
    }
    if (settings.breakRemindersEnabled) {
      await N.scheduleNotificationAsync({
        content: { title: 'Take a quick break', body: 'One minute of breathing can reset your day.' },
        trigger: daily('14:30'),
      });
    }
  },

  /** Schedule the "back home" notification for the real end time of the adventure. */
  async notifyAdventureDone(petName: string, minutesOrEndsAt: number | string) {
    const N = await getModule();
    if (!N) return;
    const seconds = typeof minutesOrEndsAt === 'string'
      ? Math.round((new Date(minutesOrEndsAt).getTime() - Date.now()) / 1000)
      : minutesOrEndsAt * 60;
    await N.scheduleNotificationAsync({
      content: { title: `${petName} is back!`, body: 'Come see what they found on their adventure.' },
      trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(5, seconds) },
    });
  },
};
