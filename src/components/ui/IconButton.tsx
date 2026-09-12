import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { haptic } from '@/utils/haptics';
import { Icon, type IconName } from './Icon';

interface Props {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  label: string;
  variant?: 'tonal' | 'plain' | 'outline';
  disabled?: boolean;
}

const AP = Animated.createAnimatedComponent(Pressable);

export function IconButton({ icon, onPress, size = 22, color, bg, label, variant = 'tonal', disabled }: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AP
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 14 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10 }))}
      onPress={() => { haptic.light(); onPress?.(); }}
      hitSlop={8}
      style={[
        styles.btn,
        variant === 'tonal' && { backgroundColor: bg ?? colors.cardAlt },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
        disabled && { opacity: 0.5 },
        anim,
      ]}
    >
      <Icon name={icon} size={size} color={color ?? colors.text} />
    </AP>
  );
}

const styles = StyleSheet.create({
  btn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
