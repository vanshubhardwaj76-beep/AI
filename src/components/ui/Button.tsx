import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { Text } from './Text';
import { haptic } from '@/utils/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, loading, disabled, fullWidth, style, testID }: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'primary' ? colors.primary
    : variant === 'secondary' ? colors.primarySoft
    : variant === 'danger' ? colors.danger
    : 'transparent';
  const fg =
    variant === 'primary' ? colors.onPrimary
    : variant === 'danger' ? '#fff'
    : variant === 'secondary' ? colors.text
    : colors.primary;
  const height = size === 'sm' ? 38 : size === 'lg' ? 58 : 50;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPressIn={() => (scale.value = withSpring(0.96, { damping: 15 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12 }))}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={[
        styles.base,
        { backgroundColor: bg, height, borderRadius: radius.pill, opacity: isDisabled ? 0.55 : 1 },
        variant === 'ghost' && { borderWidth: 1.5, borderColor: colors.primary },
        fullWidth && styles.full,
        anim,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={fontSize + 4} color={fg} style={{ marginRight: spacing.sm }} />}
          <Text style={{ color: fg, fontSize, fontWeight: '700' }}>{title}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
