import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { MoodValue } from '@/types';
import { MOOD_OPTIONS } from '@/data/prompts';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { Text } from '@/components/ui/Text';
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
            onPress={() => {
              haptic.selection();
              onSelect(m.value);
            }}
            style={[
              styles.opt,
              { backgroundColor: on ? m.color : colors.card, borderColor: on ? m.color : colors.border, transform: [{ scale: on ? 1.08 : 1 }] },
            ]}
          >
            <Text style={{ fontSize: compact ? 24 : 30 }}>{m.emoji}</Text>
            {!compact && (
              <Text variant="caption" style={{ fontWeight: '700', marginTop: 4, color: on ? '#2A1D12' : colors.text }}>
                {m.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  opt: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5 },
});
