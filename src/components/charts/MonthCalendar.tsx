import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { MONTH_LABELS, WEEKDAY_SHORT, monthGrid, todayKey } from '@/utils/date';

export interface DayMarks {
  ratio?: number; // goal completion ratio 0..1
  moodColor?: string;
  journal?: boolean;
  streak?: boolean;
}

interface Props {
  marks: Record<string, DayMarks>;
  selected?: string | null;
  onSelect?: (key: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

export function MonthCalendar({ marks, selected, onSelect, onMonthChange }: Props) {
  const { colors } = useTheme();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const cells = monthGrid(ym.y, ym.m);
  const today = todayKey();

  const shift = (d: number) => {
    const dt = new Date(ym.y, ym.m + d, 1);
    const next = { y: dt.getFullYear(), m: dt.getMonth() };
    setYm(next);
    onMonthChange?.(next.y, next.m);
  };

  return (
    <View>
      <View style={styles.head}>
        <Pressable onPress={() => shift(-1)} hitSlop={10} accessibilityLabel="Previous month"><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable>
        <Text variant="heading">{MONTH_LABELS[ym.m]} {ym.y}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={10} accessibilityLabel="Next month"><Ionicons name="chevron-forward" size={22} color={colors.text} /></Pressable>
      </View>
      <View style={styles.week}>
        {WEEKDAY_SHORT.map((d, i) => <Text key={i} variant="caption" muted center style={styles.cell}>{d}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={i} style={styles.cell} />;
          const m = marks[key];
          const isToday = key === today;
          const isSel = key === selected;
          const ratio = m?.ratio ?? 0;
          const bg = ratio >= 1 ? colors.success : ratio > 0 ? colors.primarySoft : 'transparent';
          return (
            <Pressable key={key} onPress={() => onSelect?.(key)} style={styles.cell} accessibilityRole="button" accessibilityLabel={key}>
              <View style={[styles.day, { backgroundColor: bg, borderColor: isSel ? colors.primary : isToday ? colors.textMuted : 'transparent' }]}>
                <Text variant="caption" style={{ fontWeight: isToday ? '800' : '600', color: ratio >= 1 ? '#1E2E28' : colors.text }}>{Number(key.slice(-2))}</Text>
                <View style={styles.dots}>
                  {m?.moodColor ? <View style={[styles.dot, { backgroundColor: m.moodColor }]} /> : null}
                  {m?.journal ? <View style={[styles.dot, { backgroundColor: '#F5A3B5' }]} /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  week: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  day: { width: 38, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2, height: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
