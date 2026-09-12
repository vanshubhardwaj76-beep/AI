import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Text, Card, Button } from '@/components/ui';
import { MonthCalendar } from '@/components/charts/MonthCalendar';
import type { DayMarks } from '@/components/charts/MonthCalendar';
import { useGoalStore } from '@/store/goalStore';
import { useMoodStore } from '@/store/moodStore';
import { useJournalStore } from '@/store/journalStore';
import { MOOD_OPTIONS } from '@/data/prompts';
import { formatLongDate, fromDateKey, todayKey } from '@/utils/date';
import { isGoalScheduledOn } from '@/utils/streaks';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const goals = useGoalStore((s) => s.goals);
  const completions = useGoalStore((s) => s.completions);
  const moods = useMoodStore((s) => s.entries);
  const journal = useJournalStore((s) => s.entries);
  const [selected, setSelected] = useState<string>(todayKey());

  const marks = useMemo(() => {
    const m: Record<string, DayMarks> = {};
    const days = new Set([...completions.map((c) => c.date), ...moods.map((x) => x.date), ...journal.map((j) => j.date)]);
    days.forEach((key) => {
      const d = fromDateKey(key);
      const scheduled = goals.filter((g) => new Date(g.createdAt) <= new Date(d.getTime() + 864e5) && isGoalScheduledOn(g, d)).length;
      const done = completions.filter((c) => c.date === key).length;
      m[key] = {
        ratio: scheduled ? done / scheduled : done ? 1 : 0,
        moodColor: MOOD_OPTIONS.find((o) => o.value === moods.find((x) => x.date === key)?.value)?.color,
        journal: journal.some((j) => j.date === key),
      };
    });
    return m;
  }, [goals, completions, moods, journal]);

  const dayCompletions = completions.filter((c) => c.date === selected);
  const dayMood = moods.find((m) => m.date === selected);
  const dayJournal = journal.filter((j) => j.date === selected);

  return (
    <Screen>
      <Header title="Calendar" back />
      <Card>
        <MonthCalendar marks={marks} selected={selected} onSelect={setSelected} />
        <View style={styles.legend}>
          <Legend color={colors.success} label="All goals done" />
          <Legend color={colors.primarySoft} label="Some done" />
          <Legend color="#F5A3B5" label="Journal" dot />
          <Legend color="#8FD3B6" label="Mood" dot />
        </View>
      </Card>

      <Text variant="heading" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{formatLongDate(selected)}</Text>
      {dayCompletions.length === 0 && !dayMood && dayJournal.length === 0 ? (
        <Card alt><Text muted>A quiet day. That's okay too.</Text></Card>
      ) : (
        <>
          {dayMood && (
            <Card style={{ marginBottom: spacing.sm }}>
              <Text variant="bodyBold">{MOOD_OPTIONS.find((o) => o.value === dayMood.value)?.emoji} Feeling {MOOD_OPTIONS.find((o) => o.value === dayMood.value)?.label.toLowerCase()}</Text>
              {dayMood.note ? <Text muted style={{ marginTop: 4 }}>{dayMood.note}</Text> : null}
            </Card>
          )}
          {dayCompletions.length > 0 && (
            <Card style={{ marginBottom: spacing.sm }}>
              <Text variant="label" muted style={{ marginBottom: 6 }}>Completed goals</Text>
              {dayCompletions.map((c) => {
                const g = goals.find((x) => x.id === c.goalId);
                return <Text key={c.id}>✅ {g?.name ?? 'A goal'} <Text variant="caption" muted>+{c.xpAwarded} XP</Text></Text>;
              })}
            </Card>
          )}
          {dayJournal.map((j) => (
            <Card key={j.id} style={{ marginBottom: spacing.sm }}>
              <Text variant="bodyBold">📝 {j.title || 'Journal entry'}</Text>
              <Text muted numberOfLines={2} style={{ marginTop: 4 }}>{j.body}</Text>
              <Button title="Open" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/journal/[id]', params: { id: j.id } })} style={{ marginTop: spacing.sm }} />
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

function Legend({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={{ width: dot ? 8 : 14, height: dot ? 8 : 14, borderRadius: dot ? 4 : 4, backgroundColor: color }} />
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
