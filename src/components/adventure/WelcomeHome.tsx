import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Screen, Text, Card, Button, Icon, IconTile } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import type { PetAnimState } from '@/engine/pets';
import type { AdventureRun, Discovery, Pet } from '@/types';
import type { AdventureLocation } from '@/data/adventures';
import { usePetStore } from '@/store/petStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';

interface Props {
  run: AdventureRun;
  loc: AdventureLocation;
  pet: Pet;
  onDone: () => void;
}

const RARITY_LABEL: Record<Discovery['rarity'], string> = { common: 'Found', uncommon: 'Nice find', rare: 'Rare find' };
const RARITY_COLOR: Record<Discovery['rarity'], string> = { common: '#6DBF9C', uncommon: '#8EC5E8', rare: '#F4C24B' };

/**
 * The return experience: the pet walks in from the edge of the house, does a
 * happy hop, greets you, then reveals each discovery one at a time. Calm,
 * warm pacing rather than confetti everywhere.
 */
export function WelcomeHome({ run, loc, pet, onDone }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const stage = Math.min(width - spacing.lg * 2, 420);
  const result = run.result!;
  const discoveries = result.discoveries ?? [];

  // step 0: arriving, 1: greeting, 2..: revealing discovery (step-2), final: story + button
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState<PetAnimState>('WALKING');
  const slide = useSharedValue(-stage * 0.6);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  useEffect(() => {
    slide.value = withTiming(0, { duration: 1600, easing: Easing.out(Easing.cubic) });
    later(() => { setAnim('EXCITED'); usePetStore.getState().triggerAnim('jump'); }, 1650);
    later(() => { setAnim('HAPPY'); setStep(1); }, 2500);
    return () => timers.current.forEach(clearTimeout);
  }, [slide]);

  const petStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slide.value }] }));
  const revealedCount = Math.max(0, Math.min(discoveries.length, step - 1));
  const allRevealed = step >= discoveries.length + 1;
  const isFinal = step >= discoveries.length + 2;

  const next = () => {
    if (isFinal) return onDone();
    if (!allRevealed) usePetStore.getState().triggerAnim('happy');
    if (allRevealed) setAnim('PROUD');
    setStep((s) => s + 1);
  };

  return (
    <Screen>
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(300)} style={{ borderRadius: 36, overflow: 'hidden', width: stage, height: stage }}>
          <Animated.View style={petStyle}>
            <PetAvatar pet={pet} size={stage} state={anim} interactive={false} />
          </Animated.View>
          <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name={loc.icon} size={14} color={loc.color} />
            <Text variant="caption" style={{ marginLeft: 6, fontFamily: 'Nunito_800ExtraBold' }}>Back from {loc.name}</Text>
          </View>
        </Animated.View>

        {step >= 1 && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', marginTop: spacing.lg }}>
            <Text variant="label" style={{ color: colors.primary, letterSpacing: 1.5 }}>WELCOME BACK</Text>
            <Text variant="display" center style={{ marginTop: 2 }}>{pet.name} is home!</Text>
            <Text muted center style={{ marginTop: 4, paddingHorizontal: spacing.md }}>
              {discoveries.length ? `${pet.name} had quite an adventure in ${loc.name}… and found ${discoveries.length === 1 ? 'something' : 'a few things'} for you.` : `${pet.name} had quite an adventure in ${loc.name}.`}
            </Text>
          </Animated.View>
        )}

        {step >= 2 && (
          <View style={{ alignSelf: 'stretch', marginTop: spacing.lg }}>
            {discoveries.slice(0, revealedCount).map((d, i) => (
              <DiscoveryCard key={d.id} d={d} fresh={i === revealedCount - 1 && !isFinal} />
            ))}
          </View>
        )}

        {isFinal && (
          <Animated.View entering={FadeInUp.duration(400)} style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
            <Card alt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm }}><Icon name="journal" size={16} color={colors.primary} /><Text variant="label" muted>From the trip</Text></View>
              <Text style={{ lineHeight: 24 }}>{result.story}</Text>
              <View style={[styles.row, { marginTop: spacing.md }]}>
                <View style={styles.stat}><Icon name="xp" size={16} color="#B8A9E8" strokeWidth={2.4} /><Text variant="bodyBold" style={{ marginLeft: 6 }}>+{result.xp} XP</Text></View>
                <View style={styles.stat}><Icon name="coins" size={16} color="#D69C2A" strokeWidth={2.4} /><Text variant="bodyBold" style={{ marginLeft: 6 }}>+{result.coins}</Text></View>
                <View style={styles.stat}><Icon name="friendship" size={16} color="#F5A3B5" strokeWidth={2.4} /><Text variant="bodyBold" style={{ marginLeft: 6 }}>+3</Text></View>
              </View>
            </Card>
            <Text variant="caption" muted center style={{ marginTop: spacing.sm }}>{pet.name} is tired now and will rest for a while.</Text>
          </Animated.View>
        )}

        {step >= 1 && (
          <Button
            title={isFinal ? 'Tuck in for a rest' : step === 1 ? (discoveries.length ? 'What did you find?' : 'Tell me about it') : allRevealed ? 'Tell me about it' : 'Next'}
            size="lg" fullWidth onPress={next} style={{ marginTop: spacing.lg }}
          />
        )}
      </View>
    </Screen>
  );
}

function DiscoveryCard({ d, fresh }: { d: Discovery; fresh: boolean }) {
  const { colors } = useTheme();
  const pop = useSharedValue(fresh ? 0.6 : 1);
  useEffect(() => {
    if (fresh) pop.value = withSequence(withTiming(1.06, { duration: 260, easing: Easing.out(Easing.back(2)) }), withSpring(1));
  }, [fresh, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const glow = useSharedValue(0);
  useEffect(() => { if (fresh && d.rarity === 'rare') glow.value = withDelay(200, withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 900 }))); }, [fresh, d.rarity, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.5 }));
  return (
    <Animated.View entering={FadeInDown.duration(350)} style={[style, { marginBottom: spacing.sm }]}>
      <Card style={[styles.disc, { borderColor: fresh ? RARITY_COLOR[d.rarity] : colors.border, borderWidth: 1.5 }]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, glowStyle, { backgroundColor: RARITY_COLOR[d.rarity], borderRadius: radius.lg }]} />
        <IconTile name={d.icon} color={d.color} size={52} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="label" style={{ color: RARITY_COLOR[d.rarity], letterSpacing: 1 }}>{fresh ? `${RARITY_LABEL[d.rarity].toUpperCase()}!` : RARITY_LABEL[d.rarity].toUpperCase()}</Text>
            {d.rarity === 'rare' && <Icon name="sparkle" size={12} color={RARITY_COLOR[d.rarity]} />}
          </View>
          <Text variant="bodyBold">{d.kind === 'coins' ? `+${d.value} coins` : d.name}</Text>
          <Text variant="caption" muted numberOfLines={2}>{d.description}</Text>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'center' },
  pill: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  disc: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, overflow: 'hidden' },
});
