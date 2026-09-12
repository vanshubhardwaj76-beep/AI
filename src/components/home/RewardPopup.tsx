import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, withRepeat } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { usePetStore } from '@/store/petStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, shadows } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Particles } from '@/components/pet/Particles';
import { playSound } from '@/services/sound';

/** Global reward / level-up popup, driven by petStore.reaction. */
export function RewardPopup() {
  const reaction = usePetStore((s) => s.reaction);
  const clear = usePetStore((s) => s.clearReaction);
  const { colors } = useTheme();

  useEffect(() => {
    if (!reaction) return;
    playSound(reaction.kind === 'levelup' ? 'levelup' : 'complete');
    const t = setTimeout(clear, reaction.kind === 'levelup' ? 3600 : 2400);
    return () => clearTimeout(t);
  }, [reaction, clear]);

  if (!reaction) return null;
  const isLevel = reaction.kind === 'levelup';

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(220)} style={styles.host} pointerEvents="box-none">
      <Pressable onPress={clear} style={StyleSheet.absoluteFill} accessibilityLabel="Dismiss" />
      <Animated.View entering={ZoomIn.springify().damping(13)} style={[styles.card, shadows.pop, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isLevel && <LinearGradient colors={['#FFD08A', '#F4A261']} style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />}
        <View style={styles.badgeWrap}>
          <Particles kind={isLevel ? 'star' : 'sparkle'} size={180} count={12} />
          <Badge isLevel={isLevel} />
        </View>
        <Text variant="title" center color={isLevel ? '#2A1D12' : colors.text}>{reaction.title}</Text>
        {reaction.subtitle ? <Text variant="caption" center color={isLevel ? '#4A2C22' : colors.textMuted} style={{ marginTop: 2 }}>{reaction.subtitle}</Text> : null}
        <View style={styles.rewards}>
          {reaction.xp ? <Counter icon="xp" value={reaction.xp} suffix=" XP" color="#B8A9E8" delay={150} /> : null}
          {reaction.energy ? <Counter icon="energy" value={reaction.energy} suffix=" Energy" color="#8FD3B6" delay={300} /> : null}
          {reaction.coins ? <Counter icon="coins" value={reaction.coins} suffix="" color="#F9DC7A" delay={450} /> : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Badge({ isLevel }: { isLevel: boolean }) {
  const s = useSharedValue(0);
  useEffect(() => { s.value = withSequence(withDelay(120, withSpring(1, { damping: 9 })), withRepeat(withSequence(withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })), -1)); }, [s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${(1 - Math.min(1, s.value)) * -90}deg` }] }));
  return (
    <Animated.View style={[styles.badge, st, { backgroundColor: isLevel ? '#FFFFFF' : '#6DBF9C' }]}>
      <Icon name={isLevel ? 'trophy' : 'check'} size={38} color={isLevel ? '#F4A261' : '#FFFFFF'} strokeWidth={3} />
    </Animated.View>
  );
}

/** Animated count-up chip. */
function Counter({ icon, value, suffix, color, delay }: { icon: IconName; value: number; suffix: string; color: string; delay: number }) {
  const [n, setN] = React.useState(0);
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = withDelay(delay, withSpring(1, { damping: 10 }));
    const start = Date.now() + delay;
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 600);
      if (p >= 0) setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [value, delay, pop]);
  const st = useAnimatedStyle(() => ({ opacity: pop.value, transform: [{ scale: 0.6 + 0.4 * pop.value }, { translateY: (1 - pop.value) * 10 }] }));
  return (
    <Animated.View style={[styles.pill, { backgroundColor: color }, st]}>
      <Icon name={icon} size={15} color="#2A1D12" strokeWidth={2.6} />
      <Text variant="caption" style={{ color: '#2A1D12', fontFamily: 'Nunito_800ExtraBold', marginLeft: 5 }}>+{n}{suffix}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 900 },
  card: { minWidth: 260, maxWidth: '82%', padding: spacing.xl, paddingTop: spacing.lg, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center', overflow: 'hidden' },
  badgeWrap: { width: 120, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  badge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  rewards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.md, gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
});
