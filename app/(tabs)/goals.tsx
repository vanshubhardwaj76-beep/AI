import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Text, Chip, EmptyState, IconButton, Card, ProgressBar } from '@/components/ui';
import { GoalRow } from '@/components/goals/GoalRow';
import { useGoalStore } from '@/store/goalStore';
import { useTodayProgress } from '@/hooks/useToday';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';
import { WEEKDAY_LABELS } from '@/utils/date';

type Filter = 'today' | 'all' | 'paused';

export default function GoalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const goals = useGoalStore((s) => s.goals);
  const complete = useGoalStore((s) => s.complete);
  const undo = useGoalStore((s) => s.undo);
  const streakFor = useGoalStore((s) => s.streakFor);
  const progress = useTodayProgress();
  const [filter, setFilter] = useState<Filter>('today');

  const list = useMemo(() => {
    if (filter === 'today') return progress.goals;
    if (filter === 'paused') return goals.filter((g) => g.paused);
    return goals.filter((g) => !g.archivedAt);
  }, [filter, goals, progress.goals]);

  return (
    <Screen>
      <Header title="Goals" subtitle={`${progress.completed} of ${progress.total} done today`} right={<IconButton icon="add" label="New goal" bg={colors.primary} color={colors.onPrimary} onPress={() => router.push('/goal/new')} />} />

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={styles.rowBetween}>
          <Text variant="bodyBold">Today's progress</Text>
          <Text muted>{Math.round(progress.ratio * 100)}%</Text>
        </View>
        <ProgressBar value={progress.ratio} />
      </Card>

      <View style={styles.filters}>
        <Chip label="Today" selected={filter === 'today'} onPress={() => setFilter('today')} />
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Paused" selected={filter === 'paused'} onPress={() => setFilter('paused')} />
      </View>

      {list.length === 0 ? (
        <EmptyState
          emoji={filter === 'paused' ? '⏸️' : '🌱'}
          title={filter === 'paused' ? 'Nothing paused' : 'No goals yet'}
          body={filter === 'paused' ? 'Paused goals will rest here until you are ready.' : 'Start with something tiny — a glass of water counts.'}
          actionLabel={filter === 'paused' ? undefined : 'Create a goal'}
          onAction={() => router.push('/goal/new')}
        />
      ) : (
        list.map((g) => (
          <View key={g.id}>
            <GoalRow
              goal={g}
              done={progress.isDone(g.id)}
              streak={streakFor(g.id)}
              onToggle={() => (progress.isDone(g.id) ? undo(g.id) : complete(g.id))}
              onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })}
            />
            {filter !== 'today' && (
              <Text variant="caption" muted style={styles.meta}>
                {g.frequency === 'daily' ? 'Every day' : g.frequency === 'weekly' ? 'Once a week' : g.days.map((d) => WEEKDAY_LABELS[d]).join(', ')}
                {g.reminderTime ? ` · ⏰ ${g.reminderTime}` : ''}
              </Text>
            )}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  filters: { flexDirection: 'row', marginBottom: spacing.sm },
  meta: { marginTop: -4, marginBottom: spacing.md, marginLeft: spacing.sm },
});
