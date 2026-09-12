import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Screen, Header, Text, Card, Button, ProgressBar, useToast, Icon, IconTile } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { Environment } from '@/components/pet/Environment';
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

const LOC_ENV: Record<string, string> = { forest: 'env_forest', beach: 'env_beach', mountains: 'env_cabin', garden: 'env_garden', snow: 'env_village', ruins: 'env_forest', space: 'env_space' };

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
          <PetAvatar pet={{ ...pet, environmentId: LOC_ENV[loc.id] ?? pet.environmentId }} size={260} mood="proud" />
          <Card style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name={loc.icon} size={20} color={loc.color} /><Text variant="heading" center>{loc.name}</Text></View>
            <Text center style={{ marginTop: spacing.sm, lineHeight: 24 }}>{result.story}</Text>
          </Card>
          <Card alt style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
            <Text variant="label" muted style={{ marginBottom: spacing.sm }}>Brought home</Text>
            <Reward icon="xp" color="#B8A9E8" label={`${result.xp} XP`} />
            <Reward icon="coins" color="#D69C2A" label={`${result.coins} coins`} />
            {result.itemIds.map((id) => <Reward key={id} icon={itemById(id)?.icon ?? 'gift'} color={itemById(id)?.color ?? '#F4A261'} label={`${itemById(id)?.name} (new item!)`} />)}
            {result.collectibleId && <Reward icon={itemById(result.collectibleId)?.icon ?? 'gift'} color={itemById(result.collectibleId)?.color ?? '#F4A261'} label={`${itemById(result.collectibleId)?.name} (collectible!)`} />}
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
          <Travelling pet={pet} envId={LOC_ENV[loc.id] ?? 'env_forest'} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md }}><Icon name={loc.icon} size={22} color={loc.color} /><Text variant="title">{loc.name}</Text></View>
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
      <Header title="Adventures" back subtitle={`${pet.energy}/${MAX_ENERGY} energy · complete goals to recharge`} />
      {ADVENTURES.map((a) => {
        const locked = pet.level < a.unlockLevel;
        const canAfford = pet.energy >= a.energyCost;
        return (
          <Pressable key={a.id} disabled={locked || !canAfford || busy} onPress={() => onStart(a.id)} accessibilityRole="button" accessibilityLabel={a.name}>
            <Card style={[styles.loc, { opacity: locked ? 0.55 : 1 }]}>
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
                      <Text variant="caption" muted>{a.durationMinutes} min</Text>
                    </>
                  )}
                </View>
              </View>
              {!locked && (canAfford ? <Icon name="arrow-right" size={20} color={colors.primary} /> : <Text variant="caption" muted>Rest</Text>)}
            </Card>
          </Pressable>
        );
      })}
      <Text variant="caption" muted center style={{ marginTop: spacing.md }}>Past adventures: {runs.filter((r) => r.claimed).length}</Text>
      {runs.filter((r) => r.claimed && r.result).slice(0, 5).map((r) => {
        const l = adventureById(r.locationId);
        return (
          <Card key={r.id} alt style={{ marginTop: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{l && <Icon name={l.icon} size={14} color={l.color} />}<Text variant="caption" muted>{l?.name} · {new Date(r.startedAt).toLocaleDateString()}</Text></View>
            <Text variant="caption" style={{ marginTop: 4 }}>{r.result?.story}</Text>
          </Card>
        );
      })}
    </Screen>
  );
}

function Travelling({ pet, envId }: { pet: NonNullable<ReturnType<typeof usePetStore.getState>['pet']>; envId: string }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withSequence(withTiming(30, { duration: 1800, easing: Easing.inOut(Easing.quad) }), withTiming(-30, { duration: 1800, easing: Easing.inOut(Easing.quad) })), -1);
  }, [x]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Environment id={envId} size={300}>
      <Animated.View style={[anim, { marginBottom: 24 }]}>
        <PetAvatar pet={pet} size={190} showEnvironment={false} interactive={false} mood="excited" />
      </Animated.View>
    </Environment>
  );
}

function Reward({ icon, color, label }: { icon: IconName; color: string; label: string }) {
  return (
    <View style={styles.reward}>
      <IconTile name={icon} color={color} size={36} />
      <Text variant="bodyBold">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  badge: { width: 64, height: 64, borderRadius: 16, overflow: 'hidden' },
  lockOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(59,42,38,0.45)', alignItems: 'center', justifyContent: 'center' },
  stage: { width: '100%', height: 220, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  reward: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
});
