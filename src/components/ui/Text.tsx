import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme';

type Variant = keyof typeof typography;

interface Props extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
  center?: boolean;
}

export function Text({ variant = 'body', muted, color, center, style, ...rest }: Props) {
  const { colors, fontsReady } = useTheme();
  const flat = StyleSheet.flatten([
    typography[variant],
    { color: color ?? (muted ? colors.textMuted : colors.text) },
    center && styles.center,
    style,
  ]) as Record<string, unknown>;
  // Never reference a font family that hasn't loaded (avoids native 'unrecognized font' errors).
  if (!fontsReady) delete flat.fontFamily;
  return <RNText {...rest} style={flat} />;
}

const styles = StyleSheet.create({ center: { textAlign: 'center' } });
