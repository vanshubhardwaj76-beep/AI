import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { Text } from './Text';
import { haptic } from '@/utils/haptics';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  color?: string;
}

export function Chip({ label, selected, onPress, icon, emoji, color }: Props) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        haptic.selection();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : colors.card,
          borderColor: selected ? accent : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      {icon ? <Ionicons name={icon} size={16} color={selected ? '#2A1D12' : colors.text} style={{ marginRight: 6 }} /> : null}
      <Text variant="caption" style={{ color: selected ? '#2A1D12' : colors.text, fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  emoji: { fontSize: 14, marginRight: 6 },
});
