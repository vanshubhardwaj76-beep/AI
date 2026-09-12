import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Text, Card } from '@/components/ui';
import { ACTIVITIES, ACTIVITY_CATEGORIES } from '@/data/activities';
import { useActivityStore } from '@/store/activityStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { todayKey } from '@/utils/date';

export default function ActivityLibrary() {
  const router = useRouter();
  const { colors } = useTheme();
  const logs = useActivityStore((s) => s.logs);
  const doneToday = new Set(logs.filter((l) => l.date === todayKey()).map((l) => l.activityId));

  return (
    <Screen>
      <Header title="Self-care activities" back subtitle="Short, gentle, and rewarding" />
      {ACTIVITY_CATEGORIES.map((cat) => (
        <View key={cat.id} style={{ marginBottom: spacing.lg }}>
          <View style={styles.catHead}>
            <View style={[styles.catIcon, { backgroundColor: cat.color + '44' }]}>
              <Ionicons name={cat.icon as any} size={18} color={cat.color} />
            </View>
            <Text variant="heading">{cat.label}</Text>
          </View>
          {ACTIVITIES.filter((a) => a.category === cat.id).map((a) => (
            <Pressable key={a.id} onPress={() => router.push({ pathname: '/activity/[id]', params: { id: a.id } })} accessibilityRole="button">
              <Card style={styles.row}>
                <Ionicons name={a.icon as any} size={24} color={cat.color} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold">{a.title}</Text>
                  <Text variant="caption" muted numberOfLines={2}>{a.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="caption" muted>{Math.max(1, Math.round(a.durationSeconds / 60))} min</Text>
                  {doneToday.has(a.id) ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : <Text variant="caption" muted>+{a.xp} XP</Text>}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  catHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  catIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
});
