import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { Text } from './Text';
import { haptic } from '@/utils/haptics';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  color?: string;
}

export function Chip({ label, selected, onPress, icon, color }: Props) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => { haptic.selection(); onPress?.(); }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : colors.card,
          borderColor: selected ? accent : colors.border,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {icon ? <Icon name={icon} size={15} color={selected ? '#2A1D12' : accent} style={{ marginRight: 6 }} /> : null}
      <Text variant="caption" style={{ color: selected ? '#2A1D12' : colors.text, fontFamily: 'Nunito_700Bold' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5, marginRight: spacing.sm, marginBottom: spacing.sm },
});
