import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';

interface Props extends ViewProps {
  padded?: boolean;
  alt?: boolean;
  tint?: string;
}

export function Card({ padded = true, alt, tint, style, children, ...rest }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: tint ?? (alt ? colors.cardAlt : colors.card),
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.3 : 0.12,
        },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    ...Platform.select({ android: { elevation: 2 }, default: {} }),
  },
  padded: { padding: spacing.lg },
});
