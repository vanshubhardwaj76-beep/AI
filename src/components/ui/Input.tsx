import React, { useState } from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
}

export function Input({ label, error, hint, style, multiline, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label && (
        <Text variant="label" muted style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        {...rest}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
          },
          multiline && styles.multi,
          style,
        ]}
      />
      {error ? (
        <Text variant="caption" color={colors.danger} style={styles.help}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" muted style={styles.help}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  multi: { minHeight: 120, textAlignVertical: 'top' },
  help: { marginTop: spacing.xs, marginLeft: spacing.xs },
});
