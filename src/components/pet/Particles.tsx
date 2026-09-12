import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';

type Kind = 'sparkle' | 'heart' | 'star' | 'coin';

interface Props { kind: Kind; size: number; count?: number; onDone?: () => void }

const COLORS: Record<Kind, string[]> = {
  sparkle: ['#F9DC7A', '#FFFFFF', '#8EC5E8', '#B8A9E8'],
  heart: ['#F07A8E', '#F5A3B5', '#FFD0DA'],
  star: ['#F9DC7A', '#FFE08A', '#FFFFFF', '#F4C24B'],
  coin: ['#F4C24B', '#F9DC7A', '#FFE08A'],
};

/** A one-shot burst of icon particles radiating from the centre. Remount (change key) to replay. */
export function Particles({ kind, size, count = 10 }: Props) {
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ angle: (i / count) * Math.PI * 2 + Math.random() * 0.5, dist: size * (0.28 + Math.random() * 0.2), delay: Math.random() * 120, s: 10 + Math.random() * 10, color: COLORS[kind][i % COLORS[kind].length] })),
    [count, size, kind],
  );
  return (
    <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
      {items.map((p, i) => <Particle key={i} {...p} kind={kind} />)}
    </View>
  );
}

function Particle({ angle, dist, delay, s, color, kind }: { angle: number; dist: number; delay: number; s: number; color: string; kind: Kind }) {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })); }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.7 ? 1 : 1 - (t.value - 0.7) / 0.3,
    transform: [
      { translateX: Math.cos(angle) * dist * t.value },
      { translateY: Math.sin(angle) * dist * t.value - (kind === 'heart' ? 30 * t.value : 0) + 40 * t.value * t.value },
      { scale: 0.4 + 0.8 * (1 - Math.abs(t.value - 0.4)) },
      { rotate: `${t.value * 180}deg` },
    ],
  }));
  const name = kind === 'heart' ? 'heart' : kind === 'star' ? 'star' : kind === 'coin' ? 'coins' : 'sparkle';
  return (
    <Animated.View style={[styles.p, style]}>
      <Icon name={name} size={s} color={color} fill={kind === 'coin' ? 'none' : color} strokeWidth={2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' }, p: { position: 'absolute' } });
