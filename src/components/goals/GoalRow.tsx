import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { Goal } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { Text } from '@/components/ui/Text';
import { haptic } from '@/utils/haptics';

interface Props {
  goal: Goal;
  done: boolean;
  streak?: number;
  onToggle: () => void;
  onPress?: () => void;
}

export function GoalRow({ goal, done, streak = 0, onToggle, onPress }: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const toggle = () => {
    scale.value = withSequence(withSpring(1.25, { damping: 6 }), withSpring(1));
    if (done) haptic.light();
    else haptic.success();
    onToggle();
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${goal.name}, ${done ? 'completed' : 'not completed'}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : goal.paused ? 0.6 : 1 },
      ]}
    >
      <Pressable onPress={toggle} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={done ? 'Undo' : 'Complete'}>
        <Animated.View
          style={[
            styles.check,
            { borderColor: goal.color, backgroundColor: done ? goal.color : 'transparent' },
            anim,
          ]}
        >
          {done && <Ionicons name="checkmark" size={20} color="#2A1D12" />}
        </Animated.View>
      </Pressable>
      <View style={[styles.icon, { backgroundColor: goal.color + '33' }]}>
        <Ionicons name={goal.icon as any} size={20} color={goal.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyBold" style={done && styles.strike} numberOfLines={1}>
          {goal.name}
        </Text>
        {goal.description ? (
          <Text variant="caption" muted numberOfLines={1}>
            {goal.description}
          </Text>
        ) : null}
      </View>
      {goal.paused ? (
        <Ionicons name="pause-circle" size={18} color={colors.textMuted} />
      ) : streak > 0 ? (
        <View style={[styles.streak, { backgroundColor: colors.cardAlt }]}>
          <Text variant="caption" style={{ fontWeight: '800' }}>
            🔥 {streak}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  strike: { textDecorationLine: 'line-through', opacity: 0.6 },
  streak: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
});
