import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen, Header, Text, Card } from '@/components/ui';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { useGoalStore } from '@/store/goalStore';
import { usePetStore } from '@/store/petStore';
import { useMoodStore } from '@/store/moodStore';
import { useJournalStore } from '@/store/journalStore';
import { useActivityStore } from '@/store/activityStore';
import { addDays, daysAgoKey, toDateKey, WEEKDAY_SHORT, fromDateKey } from '@/utils/date';
import { isGoalScheduledOn, longestStreak } from '@/utils/streaks';
import { levelFromXp, levelTitle } from '@/utils/leveling';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, IconTile, type IconName } from '@/components/ui/Icon';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const goals = useGoalStore((s) => s.goals);
  const completions = useGoalStore((s) => s.completions);
  const streak = useGoalStore((s) => s.overallStreak());
  const pet = usePetStore((s) => s.pet);
  const moods = useMoodStore((s) => s.entries);
  const journal = useJournalStore((s) => s.entries);
  const activities = useActivityStore((s) => s.logs);

  const week = useMemo(() => {
    const out: { label: string; value: number; scheduled: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const key = toDateKey(d);
      const scheduled = goals.filter((g) => !g.paused && new Date(g.createdAt) <= addDays(d, 1) && isGoalScheduledOn(g, d)).length;
      const done = completions.filter((c) => c.date === key).length;
      out.push({ label: WEEKDAY_SHORT[d.getDay()], value: done, scheduled });
    }
    return out;
  }, [goals, completions]);

  const weekRate = useMemo(() => {
    const s = week.reduce((a, w) => a + w.scheduled, 0);
    const d = week.reduce((a, w) => a + Math.min(w.value, w.scheduled || w.value), 0);
    return s ? Math.round((d / s) * 100) : 0;
  }, [week]);

  const month = useMemo(() => {
    const out: number[] = [];
    for (let i = 29; i >= 0; i--) out.push(completions.filter((c) => c.date === daysAgoKey(i)).length);
    return out;
  }, [completions]);

  const moodLine = useMemo(() => {
    const out: (number | null)[] = [];
    for (let i = 13; i >= 0; i--) out.push(moods.find((m) => m.date === daysAgoKey(i))?.value ?? null);
    return out;
  }, [moods]);

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    completions.forEach((c) => {
      const g = goals.find((x) => x.id === c.goalId);
      if (g) m[g.category] = (m[g.category] ?? 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [completions, goals]);

  const lvl = levelFromXp(pet?.xp ?? 0);
  const activeDays = new Set(completions.map((c) => c.date)).size;

  return (
    <Screen>
      <Header title="Progress" back subtitle="Small steps add up" />
      <View style={styles.grid}>
        <Stat icon="streak" color="#E76F51" label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} />
        <Stat icon="trophy" color="#F4C24B" label="Longest streak" value={`${longestStreak(completions)} days`} />
        <Stat icon="check-circle" color="#4FA98B" label="Goals completed" value={String(completions.length)} />
        <Stat icon="calendar" color="#8EC5E8" label="Active days" value={String(activeDays)} />
        <Stat icon="level" color="#F4A261" label={`Level ${lvl.level}`} value={levelTitle(lvl.level)} />
        <Stat icon="xp" color="#B8A9E8" label="Total XP" value={String(pet?.xp ?? 0)} />
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.rowBetween}>
          <Text variant="heading">This week</Text>
          <Text variant="bodyBold" color={colors.primary}>{weekRate}%</Text>
        </View>
        <Text variant="caption" muted style={{ marginBottom: spacing.md }}>Weekly completion rate</Text>
        <BarChart data={week.map((w) => ({ label: w.label, value: w.value, color: w.scheduled && w.value >= w.scheduled ? colors.success : colors.primary }))} />
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text variant="heading">Last 30 days</Text>
        <Text variant="caption" muted style={{ marginBottom: spacing.sm }}>Goals completed per day</Text>
        <LineChart values={month} min={0} max={Math.max(3, ...month)} color="#8FD3B6" height={100} />
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text variant="heading">Mood · 14 days</Text>
        <Text variant="caption" muted style={{ marginBottom: spacing.sm }}>{moods.length} check-ins total</Text>
        {moods.length ? <LineChart values={moodLine} min={1} max={5} color="#B8A9E8" height={100} /> : <Text muted>No check-ins yet.</Text>}
      </Card>

      {byCategory.length > 0 && (
        <Card style={{ marginTop: spacing.md }}>
          <Text variant="heading" style={{ marginBottom: spacing.sm }}>Where your energy goes</Text>
          {byCategory.map(([cat, n]) => (
            <View key={cat} style={styles.rowBetween}>
              <Text style={{ textTransform: 'capitalize' }}>{cat}</Text>
              <Text variant="bodyBold">{n}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card alt style={{ marginTop: spacing.md }}>
        <Text variant="heading" style={{ marginBottom: spacing.sm }}>Also this month</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}><Icon name="journaling" size={16} color="#F5A3B5" /><Text muted>{journal.filter((j) => fromDateKey(j.date) >= addDays(new Date(), -30)).length} journal entries</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name="mindfulness" size={16} color="#4FA98B" /><Text muted>{activities.filter((a) => fromDateKey(a.date) >= addDays(new Date(), -30)).length} self-care activities</Text></View>
      </Card>
    </Screen>
  );
}

function Stat({ icon, color, label, value }: { icon: IconName; color: string; label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <IconTile name={icon} color={color} size={36} />
      <Text variant="heading" style={{ marginTop: 4 }}>{value}</Text>
      <Text variant="caption" muted>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { width: '48%', flexGrow: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
});
