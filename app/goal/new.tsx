import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Header, useToast } from '@/components/ui';
import { GoalForm } from '@/components/goals/GoalForm';
import { useGoalStore } from '@/store/goalStore';

export default function NewGoal() {
  const router = useRouter();
  const toast = useToast();
  const add = useGoalStore((s) => s.add);
  return (
    <Screen>
      <Header title="New goal" back />
      <GoalForm
        submitLabel="Create goal"
        onSubmit={async (input) => {
          await add(input);
          toast('Goal created', 'success');
          router.back();
        }}
      />
    </Screen>
  );
}
