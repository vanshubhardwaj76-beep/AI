import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Screen, Header, Text, Card, Button, ProgressBar, useToast } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { useAdventureStore } from '@/store/adventureStore';
import { usePetStore } from '@/store/petStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ADVENTURES, adventureById } from '@/data/adventures';
import { itemById } from '@/data/items';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { AdventureResult } from '@/types';
import { notificationService } from '@/services/notifications';
import { MAX_ENERGY } from '@/utils/leveling';

export default function AdventureScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const pet = usePetStore((s) => s.pet);
  const runs = useAdventureStore((s) => s.runs);
  const active = runs.find((r) => !r.claimed);
  const start = useAdventureStore((s) => s.start);
  const claim = useAdventureStore((s) => s.claim);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState<AdventureResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!pet) return null;
  const loc = active ? adventureById(active.locationId) : null;
  const startMs = active ? new Date(active.startedAt).getTime() : 0;
  const endMs = active ? new Date(active.endsAt).getTime() : 0;
  const progress = active ? Math.min(1, (now - startMs) / Math.max(1, endMs - startMs)) : 0;
  const remainingSec = active ? Math.max(0, Math.ceil((endMs - now) / 1000)) : 0;
  const done = active && remainingSec === 0;

  const onStart = async (id: string) => {
    setBusy(true);
    const res = await start(id);
    setBusy(false);
    if (!res.ok) return toast(res.reason ?? 'Could not start', 'error');
    const l = adventureById(id)!;
    toast(`${pet.name} set off for ${l.name}!`, 'success');
    if (useSettingsStore.getState().settings.notificationsEnabled) notificationService.notifyAdventureDone(pet.name, l.durationMinutes);
  };

  const onClaim = async () => {
    if (!active) return;
    setBusy(true);
    const r = await claim(active.id);
    setBusy(false);
    if (r) setResult(r);
  };

  if (result && loc) {
    return (
      <Screen>
        <Header title={`${pet.name} is back!`} back />
        <Animated.View entering={FadeInDown.duration(400)} style={styles.center}>
          <PetAvatar pet={pet} size={200} showEnvironment={false} />
          <Card style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
            <Text variant="heading" center>{loc.emoji} {loc.name}</Text>
            <Text center style={{ marginTop: spacing.sm, lineHeight: 24 }}>{result.story}</Text>
          </Card>
          <Card alt style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
            <Text variant="label" muted style={{ marginBottom: spacing.sm }}>Brought home</Text>
            <Reward emoji="✨" label={`${result.xp} XP`} />
            <Reward emoji="🪙" label={`${result.coins} coins`} />
            {result.itemIds.map((id) => <Reward key={id} emoji={itemById(id)?.emoji ?? '🎁'} label={`${itemById(id)?.name} (new item!)`} />)}
            {result.collectibleId && <Reward emoji={itemById(result.collectibleId)?.emoji ?? '🎁'} label={`${itemById(result.collectibleId)?.name} (collectible!)`} />}
          </Card>
          <Button title="Wonderful" size="lg" fullWidth onPress={() => setResult(null)} style={{ marginTop: spacing.lg }} />
        </Animated.View>
      </Screen>
    );
  }

  if (active && loc) {
    return (
      <Screen>
        <Header title="Adventure in progress" back />
        <View style={styles.center}>
          <Travelling pet={pet} color={loc.color} />
          <Text variant="title" style={{ marginTop: spacing.md }}>{loc.emoji} {loc.name}</Text>
          <Text muted center style={{ marginTop: 4 }}>{done ? `${pet.name} is on the way home!` : `${pet.name} is exploring…`}</Text>
          <View style={{ alignSelf: 'stretch', marginTop: spacing.lg }}>
            <ProgressBar value={progress} color={loc.color} height={16} />
            <Text variant="caption" muted center style={{ marginTop: 6 }}>
              {done ? 'Ready to return' : `${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, '0')} remaining`}
            </Text>
          </View>
          <Button title={done ? 'Welcome home!' : 'Come back later'} size="lg" fullWidth disabled={!done} loading={busy} onPress={onClaim} style={{ marginTop: spacing.lg }} />
          {!done && <Text variant="caption" muted center style={{ marginTop: spacing.sm }}>Adventures continue while the app is closed.</Text>}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Adventures" back subtitle={`⚡ ${pet.energy}/${MAX_ENERGY} energy · complete goals to recharge`} />
      {ADVENTURES.map((a) => {
        const locked = pet.level < a.unlockLevel;
        const canAfford = pet.energy >= a.energyCost;
        return (
          <Pressable key={a.id} disabled={locked || !canAfford || busy} onPress={() => onStart(a.id)} accessibilityRole="button" accessibilityLabel={a.name}>
            <Card style={[styles.loc, { opacity: locked ? 0.55 : 1 }]}>
              <View style={[styles.badge, { backgroundColor: a.color + '66' }]}>
                <Text style={{ fontSize: 30 }}>{locked ? '🔒' : a.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyBold">{a.name}</Text>
                <Text variant="caption" muted>{a.description}</Text>
                <Text variant="caption" style={{ marginTop: 4, color: canAfford || locked ? colors.textMuted : colors.danger }}>
                  {locked ? `Unlocks at level ${a.unlockLevel}` : `⚡ ${a.energyCost} · ⏱ ${a.durationMinutes} min`}
                </Text>
              </View>
              {!locked && <Text variant="bodyBold" color={canAfford ? colors.primary : colors.textMuted}>{canAfford ? 'Go →' : 'Rest'}</Text>}
            </Card>
          </Pressable>
        );
      })}
      <Text variant="caption" muted center style={{ marginTop: spacing.md }}>Past adventures: {runs.filter((r) => r.claimed).length}</Text>
      {runs.filter((r) => r.claimed && r.result).slice(0, 5).map((r) => {
        const l = adventureById(r.locationId);
        return (
          <Card key={r.id} alt style={{ marginTop: spacing.sm }}>
            <Text variant="caption" muted>{l?.emoji} {l?.name} · {new Date(r.startedAt).toLocaleDateString()}</Text>
            <Text variant="caption" style={{ marginTop: 4 }}>{r.result?.story}</Text>
          </Card>
        );
      })}
    </Screen>
  );
}

function Travelling({ pet, color }: { pet: NonNullable<ReturnType<typeof usePetStore.getState>['pet']>; color: string }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withSequence(withTiming(30, { duration: 1800, easing: Easing.inOut(Easing.quad) }), withTiming(-30, { duration: 1800, easing: Easing.inOut(Easing.quad) })), -1);
  }, [x]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={[styles.stage, { backgroundColor: color + '44' }]}>
      <Animated.View style={anim}>
        <PetAvatar pet={pet} size={180} showEnvironment={false} interactive={false} mood="excited" />
      </Animated.View>
    </View>
  );
}

function Reward({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={styles.reward}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text variant="bodyBold">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  badge: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  stage: { width: '100%', height: 220, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  reward: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
});
