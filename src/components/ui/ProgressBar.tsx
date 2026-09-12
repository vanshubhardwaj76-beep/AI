import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  value: number; // 0..1
  color?: string;
  track?: string;
  height?: number;
}

export function ProgressBar({ value, color, track, height = 12 }: Props) {
  const { colors } = useTheme();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withSpring(Math.max(0, Math.min(1, value)) * 100, { damping: 18, stiffness: 90 });
  }, [value, w]);
  const anim = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, { backgroundColor: track ?? colors.cardAlt, height, borderRadius: height / 2 }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color ?? colors.primary, borderRadius: height / 2 }, anim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
