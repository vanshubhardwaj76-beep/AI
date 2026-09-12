import React, { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Header, Text, Card, Button, ProgressBar, useToast, Icon } from '@/components/ui';
import { Environment } from '@/components/pet/Environment';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { WelcomeHome } from '@/components/adventure/WelcomeHome';
import { useAdventureStore, formatDuration, phaseOf, progressOf, remainingMs } from '@/store/adventureStore';
import { usePetStore } from '@/store/petStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ADVENTURES, adventureById, LOC_ENV } from '@/data/adventures';
import { useAdventureClock } from '@/hooks/useAdventureClock';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { notificationService } from '@/services/notifications';
import { MAX_ENERGY } from '@/utils/leveling';

export default function AdventureScreen() {
  const toast = useToast();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const pet = usePetStore((s) => s.pet);
  const runs = useAdventureStore((s) => s.runs);
  useAdventureStore((s) => s.tick);
  const start = useAdventureStore((s) => s.start);
  const now = useAdventureClock();
  const [busy, setBusy] = useState(false);

  if (!pet) return null;
  const current = runs.find((r) => phaseOf(r, now) !== 'idle');
  const phase = phaseOf(current, now);
  const loc = current ? adventureById(current.locationId) : null;
  const stage = Math.max(240, Math.min(width - spacing.lg * 2, 420));

  const onStart = async (id: string) => {
    setBusy(true);
    const res = await start(id);
    setBusy(false);
    if (!res.ok) return toast(res.reason ?? 'Could not start', 'error');
    const l = adventureById(id)!;
    toast(`${pet.name} set off for ${l.name}!`, 'success');
    if (useSettingsStore.getState().settings.notificationsEnabled && res.run) notificationService.notifyAdventureDone(pet.name, res.run.endsAt);
  };

  // ---- RETURNED: welcome-home sequence ----
  if (current && loc && phase === 'returned' && current.result) {
    return <WelcomeHome run={current} loc={loc} pet={pet} onDone={() => useAdventureStore.getState().markSeen(current.id)} />;
  }

  // ---- ON_ADVENTURE: travelling scene ----
  if (current && loc && phase === 'on_adventure') {
    const progress = progressOf(current.startedAt, current.endsAt, now);
    const left = remainingMs(current.endsAt, now);
    const waitingForSync = left === 0;
    return (
      <Screen>
        <Header title="Adventure in progress" back />
        <View style={styles.center}>
          <View style={{ borderRadius: 36, overflow: 'hidden' }}>
            <PetAvatar pet={pet} size={stage} state="WALKING" scrollEnvironment environmentId={LOC_ENV[loc.id] ?? 'env_forest'} interactive={false} />
            <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name={loc.icon} size={14} color={loc.color} />
              <Text variant="caption" style={{ marginLeft: 6, fontFamily: 'Nunito_800ExtraBold' }}>{loc.name}</Text>
            </View>
          </View>
          <Text variant="title" center style={{ marginTop: spacing.lg }}>{waitingForSync ? `${pet.name} is almost home` : `${pet.name} is exploring ${loc.name}`}</Text>
          <Text muted center style={{ marginTop: 4, paddingHorizontal: spacing.md }}>{loc.description}</Text>
          <Card style={{ alignSelf: 'stretch', marginTop: spacing.lg }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="timer" size={16} color={colors.textMuted} /><Text variant="caption" muted>Time remaining</Text></View>
              <Text variant="heading">{waitingForSync ? 'Any moment' : formatDuration(left)}</Text>
            </View>
            <ProgressBar value={progress} color={loc.color} height={14} style={{ marginTop: spacing.sm }} />
            <View style={[styles.rowBetween, { marginTop: 6 }]}>
              <Text variant="caption" muted>Left {new Date(current.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
              <Text variant="caption" muted>Back around {new Date(current.endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
            </View>
          </Card>
          <Text variant="caption" muted center style={{ marginTop: spacing.md }}>Adventures continue while the app is closed. We'll let you know when {pet.name} is back.</Text>
        </View>
      </Screen>
    );
  }

  // ---- RESTING or IDLE: destination list ----
  const resting = current && phase === 'resting';
  return (
    <Screen>
      <Header title="Adventures" back subtitle={`${pet.energy}/${MAX_ENERGY} energy · complete goals to recharge`} />
      {resting && loc && (
        <Card alt style={[styles.loc, { marginBottom: spacing.md }]}>
          <View style={styles.badge}><PetAvatar pet={pet} size={64} state="SLEEPING" showEnvironment={false} interactive={false} /></View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold">{pet.name} is resting</Text>
            <Text variant="caption" muted>Back from {loc.name}. Ready again in {formatDuration(remainingMs(current.restEndsAt, now))}.</Text>
            <ProgressBar value={progressOf(current.restStartedAt, current.restEndsAt, now)} color="#8EC5E8" height={8} style={{ marginTop: 6 }} />
          </View>
        </Card>
      )}
      {ADVENTURES.map((a) => {
        const locked = pet.level < a.unlockLevel;
        const canAfford = pet.energy >= a.energyCost;
        const disabled = locked || !canAfford || busy || !!resting;
        return (
          <Pressable key={a.id} disabled={disabled} onPress={() => onStart(a.id)} accessibilityRole="button" accessibilityLabel={a.name}>
            <Card style={[styles.loc, { opacity: locked || resting ? 0.55 : 1 }]}>
              <View style={styles.badge}>
                <Environment id={LOC_ENV[a.id] ?? 'env_forest'} size={64} radius={16} animated={false} />
                {locked && <View style={styles.lockOverlay}><Icon name="lock" size={20} color="#FFFFFF" /></View>}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyBold">{a.name}</Text>
                <Text variant="caption" muted>{a.description}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                  {locked ? <Text variant="caption" muted>Unlocks at level {a.unlockLevel}</Text> : (
                    <>
                      <Icon name="energy" size={12} color={canAfford ? '#4FA98B' : colors.danger} strokeWidth={2.6} />
                      <Text variant="caption" style={{ color: canAfford ? colors.textMuted : colors.danger }}>{a.energyCost}</Text>
                      <Icon name="timer" size={12} color={colors.textMuted} style={{ marginLeft: 6 }} />
                      <Text variant="caption" muted>6–8 h</Text>
                    </>
                  )}
                </View>
              </View>
              {!locked && !resting && (canAfford ? <Icon name="arrow-right" size={20} color={colors.primary} /> : <Text variant="caption" muted>Rest</Text>)}
            </Card>
          </Pressable>
        );
      })}
      <Text variant="caption" muted center style={{ marginTop: spacing.md }}>Past adventures: {runs.filter((r) => r.completedAt).length}</Text>
      {runs.filter((r) => r.completedAt && r.result).slice(0, 5).map((r) => {
        const l = adventureById(r.locationId);
        return (
          <Animated.View key={r.id} entering={FadeInDown.duration(250)}>
            <Card alt style={{ marginTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{l && <Icon name={l.icon} size={14} color={l.color} />}<Text variant="caption" muted>{l?.name} · {new Date(r.startedAt).toLocaleDateString()}</Text></View>
              <Text variant="caption" style={{ marginTop: 4 }}>{r.result?.story}</Text>
              {!!r.result?.discoveries?.length && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {r.result.discoveries.map((d) => (
                    <View key={d.id} style={[styles.chip, { borderColor: colors.border }]}><Icon name={d.icon} size={12} color={d.color} /><Text variant="caption" style={{ marginLeft: 4 }}>{d.name}</Text></View>
                  ))}
                </View>
              )}
            </Card>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  badge: { width: 64, height: 64, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  lockOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(59,42,38,0.45)', alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
});
