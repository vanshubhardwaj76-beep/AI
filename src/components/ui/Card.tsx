import React from 'react';
import { View, ViewProps, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, shadows } from '@/theme';

interface Props extends ViewProps {
  padded?: boolean;
  alt?: boolean;
  tint?: string;
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ padded = true, alt, tint, style, children, onPress, elevated = true, ...rest }: Props) {
  const { colors, isDark } = useTheme();
  const base = [
    styles.card,
    elevated && shadows.card,
    { backgroundColor: tint ?? (alt ? colors.cardAlt : colors.card), borderColor: colors.border, shadowColor: colors.shadow, shadowOpacity: isDark ? 0.3 : 0.12 },
    padded && styles.padded,
  ];
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...base, { transform: [{ scale: pressed ? 0.985 : 1 }], opacity: pressed ? 0.94 : 1 }, style]} {...(rest as any)}>
        {children}
      </Pressable>
    );
  }
  return <View {...rest} style={[...base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  padded: { padding: spacing.lg },
});
