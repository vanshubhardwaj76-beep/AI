import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { Text } from './Text';
import { haptic } from '@/utils/haptics';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Tactile pill button: gradient fill, 3D bottom edge, press squash, loading + disabled states. */
export function Button({ title, onPress, variant = 'primary', size = 'md', icon, iconRight, loading, disabled, fullWidth, style, testID }: Props) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const press = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateY: press.value * 2 }] }));

  const isDisabled = disabled || loading;
  const height = size === 'sm' ? 38 : size === 'lg' ? 58 : 50;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  const grad: [string, string] | null =
    variant === 'primary' ? ['#FFB573', '#F4A261']
    : variant === 'accent' ? ['#9EDCC2', '#6DBF9C']
    : variant === 'danger' ? ['#F28B76', '#E76F51']
    : null;
  const edge = variant === 'primary' ? '#D67A3E' : variant === 'accent' ? '#4FA98B' : variant === 'danger' ? '#BE4E36' : variant === 'secondary' ? (isDark ? '#3B3654' : '#EBD3BA') : 'transparent';
  const bg = variant === 'secondary' ? colors.primarySoft : 'transparent';
  const fg = variant === 'primary' || variant === 'accent' ? '#2A1D12' : variant === 'danger' ? '#FFFFFF' : variant === 'secondary' ? colors.text : colors.primary;

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); press.value = withSpring(1, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); press.value = withSpring(0, { damping: 12 }); }}
      onPress={() => { haptic.light(); onPress?.(); }}
      style={[styles.outer, { height: height + 3, borderRadius: radius.pill, backgroundColor: edge, opacity: isDisabled ? 0.55 : 1 }, fullWidth && styles.full, anim, style]}
    >
      <View style={[styles.inner, { height, borderRadius: radius.pill, backgroundColor: bg }, variant === 'ghost' && { borderWidth: 1.5, borderColor: colors.primary }]}>
        {grad && <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]} />}
        {grad && <View style={[styles.gloss, { borderRadius: radius.pill }]} />}
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.row}>
            {icon && <Icon name={icon} size={fontSize + 3} color={fg} strokeWidth={2.4} style={{ marginRight: spacing.sm }} />}
            <Text style={{ color: fg, fontSize, fontFamily: 'Nunito_800ExtraBold', fontWeight: '800' }}>{title}</Text>
            {iconRight && <Icon name={iconRight} size={fontSize + 3} color={fg} strokeWidth={2.4} style={{ marginLeft: spacing.sm }} />}
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  outer: { alignSelf: 'flex-start' },
  full: { alignSelf: 'stretch' },
  inner: { paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gloss: { position: 'absolute', left: 6, right: 6, top: 3, height: '40%', backgroundColor: 'rgba(255,255,255,0.22)' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
