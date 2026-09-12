import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Text, Card, Button, EmptyState } from '@/components/ui';
import { MoodCalendar } from '@/components/charts/MoodCalendar';
import { LineChart } from '@/components/charts/LineChart';
import { useMoodStore } from '@/store/moodStore';
import { MOOD_OPTIONS } from '@/data/prompts';
import { daysAgoKey, formatLongDate } from '@/utils/date';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export default function MoodHistory() {
  const router = useRouter();
  const { colors } = useTheme();
  const entries = useMoodStore((s) => s.entries);
  const [selected, setSelected] = useState<string | null>(null);

  const last14 = useMemo(() => {
    const out: (number | null)[] = [];
    for (let i = 13; i >= 0; i--) {
      const e = entries.find((x) => x.date === daysAgoKey(i));
      out.push(e ? e.value : null);
    }
    return out;
  }, [entries]);

  const avg = useMemo(() => {
    const vals = last14.filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [last14]);

  const sel = selected ? entries.find((e) => e.date === selected) : null;

  return (
    <Screen>
      <Header title="Mood history" back right={<Button title="Check in" size="sm" onPress={() => router.push('/mood')} />} />
      {entries.length === 0 ? (
        <EmptyState emoji="🫶" title="No check-ins yet" body="Track how you feel and spot gentle patterns over time." actionLabel="Check in now" onAction={() => router.push('/mood')} />
      ) : (
        <>
          <Card>
            <Text variant="label" muted>Last 14 days</Text>
            <Text variant="heading" style={{ marginBottom: spacing.sm }}>
              Average: {avg ? MOOD_OPTIONS.find((m) => m.value === Math.round(avg))?.emoji : '—'} {avg.toFixed(1)}/5
            </Text>
            <LineChart values={last14} min={1} max={5} color={colors.primary} height={120} />
          </Card>
          <Card style={{ marginTop: spacing.md }}>
            <MoodCalendar onSelect={setSelected} selected={selected} />
          </Card>
          {sel && (
            <Card alt style={{ marginTop: spacing.md }}>
              <View style={styles.row}>
                <Text style={{ fontSize: 32 }}>{MOOD_OPTIONS.find((m) => m.value === sel.value)?.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold">{formatLongDate(sel.date)}</Text>
                  <Text muted>{MOOD_OPTIONS.find((m) => m.value === sel.value)?.label}</Text>
                </View>
              </View>
              {sel.note ? <Text style={{ marginTop: spacing.sm }}>{sel.note}</Text> : null}
            </Card>
          )}
          <Text variant="label" muted style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Recent</Text>
          {entries.slice(0, 10).map((e) => (
            <Pressable key={e.id} onPress={() => setSelected(e.date)}>
              <Card style={[styles.row, { marginBottom: spacing.sm }]}>
                <Text style={{ fontSize: 26 }}>{MOOD_OPTIONS.find((m) => m.value === e.value)?.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold">{formatLongDate(e.date)}</Text>
                  {e.note ? <Text variant="caption" muted numberOfLines={1}>{e.note}</Text> : null}
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md } });
