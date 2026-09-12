import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, ProgressBar, IconTile, Icon } from '@/components/ui';
import { Environment } from '@/components/pet/Environment';
import { useAdventureStore, formatDuration, phaseOf, progressOf, remainingMs } from '@/store/adventureStore';
import { useAdventureClock } from '@/hooks/useAdventureClock';
import { adventureById } from '@/data/adventures';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, shadows } from '@/theme';
import type { Pet } from '@/types';

/**
 * Hook: is the pet currently away from home (on an adventure or just returned,
 * not yet welcomed)? Every screen that draws the pet uses this so the pet is
 * never shown at home while travelling.
 */
export function usePetAway() {
  useAdventureStore((s) => s.tick);
  const runs = useAdventureStore((s) => s.runs);
  const now = useAdventureClock(15_000);
  const run = runs.find((r) => phaseOf(r, now) !== 'idle');
  const phase = phaseOf(run, now);
  return { away: phase === 'on_adventure' || phase === 'returned', resting: phase === 'resting', phase, run, loc: run ? adventureById(run.locationId) : undefined };
}

/** The empty home + "away" card shown wherever the pet stage would normally be. */
export function AwayStage({ pet, size, radius: r = 36 }: { pet: Pet; size: number; radius?: number }) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const now = useAdventureClock();
  const { run, loc, phase } = usePetAway();
  if (!run || !loc) return <Environment id={pet.environmentId} size={size} radius={r} />;
  const returned = phase === 'returned';
  return (
    <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden' }}>
      <Environment id={pet.environmentId} size={size} radius={r} />
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.94)', borderColor: colors.border }]}>
        <IconTile name={loc.icon} color={loc.color} size={48} />
        <Text variant="bodyBold" center style={{ marginTop: spacing.sm }}>{pet.name} is away on an adventure</Text>
        <Text variant="caption" muted center>{returned ? `Just got back from ${loc.name}!` : `Exploring ${loc.name} · back in ${formatDuration(remainingMs(run.endsAt, now))}`}</Text>
        <ProgressBar value={returned ? 1 : progressOf(run.startedAt, run.endsAt, now)} color={loc.color} height={8} style={{ alignSelf: 'stretch', marginTop: spacing.sm }} />
        <Button title={returned ? 'Welcome them home' : 'Check in'} size="sm" onPress={() => router.push('/adventure')} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

/** Small inline placeholder for compact spots (profile hero, mood/activity result). */
export function AwayBadge({ pet, size = 96 }: { pet: Pet; size?: number }) {
  const { colors } = useTheme();
  const { loc } = usePetAway();
  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor: colors.cardAlt, borderColor: colors.border }]} accessibilityLabel={`${pet.name} is away`}>
      <Icon name={loc?.icon ?? 'compass'} size={size * 0.3} color={loc?.color ?? colors.primary} />
      <Text variant="caption" muted center numberOfLines={1} style={{ marginTop: 4, fontSize: 11 }}>Away</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: '10%', right: '10%', top: '22%', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, ...shadows.card },
  badge: { borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
