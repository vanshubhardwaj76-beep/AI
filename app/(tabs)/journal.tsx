import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Text, Card, Input, EmptyState, IconButton, Chip, Icon, IconTile } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { useJournalStore } from '@/store/journalStore';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';
import { formatLongDate } from '@/utils/date';
import { JournalKind } from '@/types';
import { JOURNAL_PROMPTS } from '@/data/prompts';

const KIND_META: Record<JournalKind, { label: string; icon: IconName; color: string }> = {
  daily: { label: 'Daily', icon: 'journal', color: '#8EC5E8' },
  gratitude: { label: 'Gratitude', icon: 'heart', color: '#F5A3B5' },
  mood: { label: 'Mood note', icon: 'mood-good', color: '#F9DC7A' },
  free: { label: 'Thoughts', icon: 'cloud', color: '#B8A9E8' },
};

export default function JournalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const entries = useJournalStore((s) => s.entries);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<JournalKind | 'all'>('all');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries.filter((e) => (kind === 'all' || e.kind === kind) && (!s || e.title.toLowerCase().includes(s) || e.body.toLowerCase().includes(s)));
  }, [entries, q, kind]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    filtered.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const prompt = JOURNAL_PROMPTS[new Date().getDate() % JOURNAL_PROMPTS.length];

  return (
    <Screen>
      <Header title="Journal" subtitle={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`} right={<IconButton icon="add" label="New entry" bg={colors.primary} color={colors.onPrimary} onPress={() => router.push('/journal/new')} />} />

      <Pressable onPress={() => router.push({ pathname: '/journal/new', params: { prompt } })} accessibilityRole="button">
        <Card tint={colors.primarySoft} style={{ marginBottom: spacing.lg }}>
          <Text variant="label" muted>Today's prompt</Text>
          <Text variant="heading" style={{ marginTop: 4 }}>{prompt}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}><Text variant="caption" muted>Tap to answer</Text><Icon name="arrow-right" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} /></View>
        </Card>
      </Pressable>

      <Input value={q} onChangeText={setQ} placeholder="Search entries…" returnKeyType="search" />
      <View style={styles.filters}>
        <Chip label="All" selected={kind === 'all'} onPress={() => setKind('all')} />
        {(Object.keys(KIND_META) as JournalKind[]).map((k) => (
          <Chip key={k} label={KIND_META[k].label} icon={KIND_META[k].icon} selected={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>

      {grouped.length === 0 ? (
        <EmptyState icon="journaling" title={q ? 'No matches' : 'Your journal is empty'} body={q ? 'Try a different word.' : 'A few honest lines a day can change how you feel.'} actionLabel={q ? undefined : 'Write your first entry'} onAction={() => router.push('/journal/new')} />
      ) : (
        grouped.map(([date, list]) => (
          <View key={date} style={{ marginBottom: spacing.md }}>
            <Text variant="label" muted style={{ marginBottom: spacing.sm }}>{formatLongDate(date)}</Text>
            {list.map((e) => (
              <Pressable key={e.id} onPress={() => router.push({ pathname: '/journal/[id]', params: { id: e.id } })} accessibilityRole="button">
                <Card style={{ marginBottom: spacing.sm }}>
                  <View style={styles.row}>
                    <IconTile name={KIND_META[e.kind].icon} color={KIND_META[e.kind].color} size={34} />
                    <Text variant="bodyBold" style={{ flex: 1 }} numberOfLines={1}>{e.title || KIND_META[e.kind].label}</Text>
                  </View>
                  {e.prompt ? <Text variant="caption" color={colors.primary} style={{ marginTop: 4 }}>{e.prompt}</Text> : null}
                  <Text muted numberOfLines={3} style={{ marginTop: 4 }}>{e.body}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
