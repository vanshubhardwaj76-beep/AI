import React from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Header, Button, Card, Text, EmptyState, useToast } from '@/components/ui';
import { GoalForm } from '@/components/goals/GoalForm';
import { useGoalStore } from '@/store/goalStore';
import { spacing } from '@/theme';

export default function EditGoal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const goal = useGoalStore((s) => s.goals.find((g) => g.id === id));
  const update = useGoalStore((s) => s.update);
  const remove = useGoalStore((s) => s.remove);
  const togglePause = useGoalStore((s) => s.togglePause);
  const streak = useGoalStore((s) => (goal ? s.streakFor(goal.id) : 0));
  const total = useGoalStore((s) => s.completions.filter((c) => c.goalId === id).length);

  if (!goal) {
    return (
      <Screen>
        <Header title="Goal" back />
        <EmptyState icon="mindfulness" title="This goal is gone" actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const confirmDelete = () => {
    const doIt = async () => {
      await remove(goal.id);
      toast('Goal deleted');
      router.back();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${goal.name}"? Its history will be removed too.`)) doIt();
    } else {
      Alert.alert('Delete goal?', `"${goal.name}" and its history will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doIt },
      ]);
    }
  };

  return (
    <Screen>
      <Header title="Edit goal" back />
      <Card alt style={{ marginBottom: spacing.lg }}>
        <View style={styles.stats}>
          <Stat label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} />
          <Stat label="Times done" value={String(total)} />
          <Stat label="Status" value={goal.paused ? 'Paused' : 'Active'} />
        </View>
        <Button title={goal.paused ? 'Resume goal' : 'Pause goal'} variant="secondary" size="sm" onPress={() => togglePause(goal.id)} style={{ marginTop: spacing.md }} />
      </Card>
      <GoalForm
        initial={goal}
        onSubmit={async (input) => {
          await update(goal.id, input);
          toast('Saved', 'success');
          router.back();
        }}
        onDelete={confirmDelete}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="heading">{value}</Text>
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ stats: { flexDirection: 'row' } });
