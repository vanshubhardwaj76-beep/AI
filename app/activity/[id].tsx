import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Screen, Header, Text, Card, Button, EmptyState, ProgressBar } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { AwayBadge, usePetAway } from '@/components/adventure/AwayStage';
import { activityById, ACTIVITY_CATEGORIES } from '@/data/activities';
import { useActivityStore } from '@/store/activityStore';
import { usePetStore } from '@/store/petStore';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';
import { haptic } from '@/utils/haptics';

export default function ActivityPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const activity = useMemo(() => activityById(id!), [id]);
  const complete = useActivityStore((s) => s.complete);
  const pet = usePetStore((s) => s.pet);
  const { away } = usePetAway();

  const [state, setState] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scale = useSharedValue(1);
  const circle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const total = activity?.durationSeconds ?? 0;
  const steps = activity?.steps ?? [];
  const cycle = steps.reduce((a, s) => a + s.seconds, 0) || 1;

  // find current step within the (possibly looping) sequence
  const { step, stepElapsed } = useMemo(() => {
    let t = activity?.loop ? elapsed % cycle : elapsed;
    for (const s of steps) {
      if (t < s.seconds) return { step: s, stepElapsed: t };
      t -= s.seconds;
    }
    return { step: steps[steps.length - 1], stepElapsed: 0 };
  }, [elapsed, steps, cycle, activity?.loop]);

  const color = ACTIVITY_CATEGORIES.find((c) => c.id === activity?.category)?.color ?? colors.primary;

  useEffect(() => {
    if (state !== 'running') return;
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [state]);

  useEffect(() => {
    if (state === 'running' && elapsed >= total) {
      setState('done');
      haptic.success();
      complete(activity!.id);
    }
  }, [elapsed, total, state, activity, complete]);

  // breathing animation: grow on "in", shrink on "out"
  useEffect(() => {
    if (!step) return;
    const label = step.label.toLowerCase();
    const isIn = label.includes('in') && !label.includes('hold');
    const isOut = label.includes('out');
    if (state !== 'running') return;
    if (stepElapsed === 0) {
      haptic.light();
      if (isIn) scale.value = withTiming(1.35, { duration: step.seconds * 1000, easing: Easing.inOut(Easing.quad) });
      else if (isOut) scale.value = withTiming(1, { duration: step.seconds * 1000, easing: Easing.inOut(Easing.quad) });
    }
  }, [step, stepElapsed, state, scale]);

  if (!activity) {
    return (
      <Screen>
        <Header title="Activity" back />
        <EmptyState icon="mindfulness" title="Activity not found" actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const remaining = Math.max(0, total - elapsed);

  return (
    <Screen>
      <Header title={activity.title} back subtitle={`${Math.max(1, Math.round(total / 60))} min · +${activity.xp} XP`} />
      {state === 'done' ? (
        <View style={styles.center}>
          {away && pet ? <AwayBadge pet={pet} size={140} /> : <PetAvatar pet={pet} size={200} showEnvironment={false} mood="proud" />}
          <Text variant="title" center style={{ marginTop: spacing.md }}>Beautifully done.</Text>
          <Text muted center style={{ marginTop: 4 }}>{pet?.name} feels calmer too.</Text>
          <Button title="Back to activities" size="lg" fullWidth onPress={() => router.back()} style={{ marginTop: spacing.xl }} />
        </View>
      ) : (
        <>
          <View style={styles.center}>
            <View style={styles.stage}>
              <Animated.View style={[styles.circle, { backgroundColor: color + '55' }, circle]}>
                <View style={[styles.inner, { backgroundColor: color }]}>
                  <Text variant="display" style={{ color: '#2A1D12' }}>{step ? step.seconds - stepElapsed : 0}</Text>
                </View>
              </Animated.View>
            </View>
            <Text variant="title" center>{state === 'idle' ? 'Ready when you are' : step?.label}</Text>
            <Text muted center style={{ marginTop: 4 }}>{state === 'idle' ? activity.description : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} left`}</Text>
          </View>
          <View style={{ marginVertical: spacing.lg }}>
            <ProgressBar value={elapsed / total} color={color} />
          </View>
          {state === 'idle' && <Button title="Start" size="lg" fullWidth onPress={() => setState('running')} />}
          {state === 'running' && <Button title="Pause" size="lg" fullWidth variant="secondary" onPress={() => setState('paused')} />}
          {state === 'paused' && (
            <View style={{ gap: spacing.sm }}>
              <Button title="Resume" size="lg" fullWidth onPress={() => setState('running')} />
              <Button title="Restart" variant="ghost" fullWidth onPress={() => { setElapsed(0); setState('idle'); scale.value = 1; }} />
            </View>
          )}
          <Card alt style={{ marginTop: spacing.xl }}>
            <Text variant="label" muted style={{ marginBottom: spacing.sm }}>Steps</Text>
            {steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <Text muted>{i + 1}.</Text>
                <Text style={{ flex: 1 }}>{s.label}</Text>
                <Text variant="caption" muted>{s.seconds}s</Text>
              </View>
            ))}
            {activity.loop && <Text variant="caption" muted style={{ marginTop: 4 }}>Repeats until the timer ends.</Text>}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  stage: { height: 260, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 170, height: 170, borderRadius: 85, alignItems: 'center', justifyContent: 'center' },
  inner: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
});
