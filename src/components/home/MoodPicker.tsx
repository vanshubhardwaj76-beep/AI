import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { MoodValue } from '@/types';
import { MOOD_OPTIONS } from '@/data/prompts';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { haptic } from '@/utils/haptics';

interface Props {
  value?: MoodValue | null;
  onSelect: (v: MoodValue) => void;
  compact?: boolean;
}

export function MoodPicker({ value, onSelect, compact }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {MOOD_OPTIONS.map((m) => {
        const on = value === m.value;
        return (
          <Pressable
            key={m.value}
            accessibilityRole="button"
            accessibilityLabel={m.label}
            accessibilityState={{ selected: on }}
            onPress={() => { haptic.selection(); onSelect(m.value); }}
            style={({ pressed }) => [
              styles.opt,
              { backgroundColor: on ? m.color : colors.card, borderColor: on ? m.color : colors.border, transform: [{ scale: pressed ? 0.94 : on ? 1.06 : 1 }] },
            ]}
          >
            <View style={[styles.circle, { backgroundColor: on ? 'rgba(42,29,18,0.12)' : m.color + '33' }]}>
              <Icon name={m.icon} size={compact ? 22 : 26} color={on ? '#2A1D12' : m.color} strokeWidth={2.2} />
            </View>
            {!compact && <Text variant="caption" style={{ marginTop: 6, color: on ? '#2A1D12' : colors.text, fontFamily: 'Nunito_700Bold' }}>{m.label}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  opt: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
