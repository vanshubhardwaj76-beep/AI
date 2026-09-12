import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, EmptyState } from '@/components/ui';

export default function NotFound() {
  const router = useRouter();
  return (
    <Screen>
      <EmptyState icon="compass" title="Lost in the woods" body="That page doesn't exist." actionLabel="Go home" onAction={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
