import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';

interface Props {
  data: { label: string; value: number; color?: string }[];
  max?: number;
  height?: number;
}

export function BarChart({ data, max, height = 120 }: Props) {
  const { colors } = useTheme();
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={[styles.row, { height: height + 24 }]}>
      {data.map((d, i) => (
        <View key={i} style={styles.col}>
          <View style={[styles.track, { height, backgroundColor: colors.cardAlt }]}>
            <View style={[styles.bar, { height: `${Math.min(100, (d.value / top) * 100)}%`, backgroundColor: d.color ?? colors.primary }]} />
          </View>
          <Text variant="caption" muted style={{ marginTop: 6 }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col: { flex: 1, alignItems: 'center' },
  track: { width: '100%', borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 10, minHeight: 4 },
});
