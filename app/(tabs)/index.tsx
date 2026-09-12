import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button, ProgressBar, IconButton } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { GoalRow } from '@/components/goals/GoalRow';
import { StatPill } from '@/components/home/StatPill';
import { usePetStore } from '@/store/petStore';
import { useGoalStore } from '@/store/goalStore';
import { useProfileStore } from '@/store/profileStore';
import { useMoodStore } from '@/store/moodStore';
import { useAdventureStore } from '@/store/adventureStore';
import { useTodayProgress } from '@/hooks/useToday';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, radius } from '@/theme';
import { getGreeting } from '@/utils/date';
import { levelFromXp, MAX_ENERGY } from '@/utils/leveling';
import { MOOD_LABEL, MOOD_EMOJI, petLine } from '@/utils/petMood';
import { MOOD_OPTIONS } from '@/data/prompts';
import { adventureById } from '@/data/adventures';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const pet = usePetStore((s) => s.pet);
  const profile = useProfileStore((s) => s.profile);
  const complete = useGoalStore((s) => s.complete);
  const undo = useGoalStore((s) => s.undo);
  const streakFor = useGoalStore((s) => s.streakFor);
  const overall = useGoalStore((s) => s.overallStreak());
  const todayMood = useMoodStore((s) => s.todays());
  const activeRun = useAdventureStore((s) => s.active());
  const progress = useTodayProgress();
  const [lineSeed, setLineSeed] = useState(0);

  const lvl = useMemo(() => levelFromXp(pet?.xp ?? 0), [pet?.xp]);
  if (!pet) return null;

  const remaining = progress.goals.filter((g) => !progress.isDone(g.id));
  const activeLoc = activeRun ? adventureById(activeRun.locationId) : null;
  const moodOpt = todayMood ? MOOD_OPTIONS.find((m) => m.value === todayMood.value) : null;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text variant="display">{getGreeting()}</Text>
          <Text muted>{profile?.displayName ? `Hi ${profile.displayName} 👋` : 'Ready for a gentle day?'}</Text>
        </View>
        <Pressable onPress={() => router.push('/pet-shop' as any)} accessibilityRole="button" accessibilityLabel="Coins" style={[styles.coin, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text variant="bodyBold">🪙 {profile?.coins ?? 0}</Text>
        </Pressable>
      </View>

      {/* Pet */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.petWrap}>
        <PetAvatar pet={pet} size={250} onPet={() => setLineSeed((s) => s + 1)} />
        <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text variant="caption" center>{petLine(pet.mood, lineSeed)}</Text>
        </View>
        <Text variant="title" style={{ marginTop: spacing.md }}>{pet.name}</Text>
        <Text muted>
          {MOOD_LABEL[pet.mood]} {MOOD_EMOJI[pet.mood]}
        </Text>
      </Animated.View>

      {/* Energy + level */}
      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.rowBetween}>
          <Text variant="bodyBold">⚡ Energy</Text>
          <Text muted>{pet.energy}/{MAX_ENERGY}</Text>
        </View>
        <ProgressBar value={pet.energy / MAX_ENERGY} color={colors.accent} />
        <View style={[styles.rowBetween, { marginTop: spacing.md }]}>
          <Text variant="bodyBold">Level {lvl.level}</Text>
          <Text muted>{lvl.current}/{lvl.needed} XP</Text>
        </View>
        <ProgressBar value={lvl.progress} color="#B8A9E8" />
      </Card>

      {/* Stats */}
      <View style={styles.stats}>
        <StatPill icon="flame" label="Day streak" value={overall} color="#E76F51" />
        <StatPill icon="checkmark-done" label="Today" value={`${progress.completed}/${progress.total}`} color="#8FD3B6" />
      </View>

      {/* Adventure banner */}
      {activeLoc ? (
        <Pressable onPress={() => router.push('/adventure')} accessibilityRole="button">
          <Card tint={activeLoc.color + '55'} style={styles.banner}>
            <Text style={{ fontSize: 30 }}>{activeLoc.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyBold">{pet.name} is exploring {activeLoc.name}</Text>
              <Text variant="caption" muted>Tap to check in</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Card>
        </Pressable>
      ) : pet.energy >= 25 ? (
        <Pressable onPress={() => router.push('/adventure')} accessibilityRole="button">
          <Card tint={colors.primarySoft} style={styles.banner}>
            <Text style={{ fontSize: 30 }}>🧭</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyBold">{pet.name} has enough energy for an adventure!</Text>
              <Text variant="caption" muted>Send them exploring</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Card>
        </Pressable>
      ) : null}

      {/* Mood check-in */}
      <Pressable onPress={() => router.push('/mood')} accessibilityRole="button">
        <Card style={styles.banner}>
          <Text style={{ fontSize: 30 }}>{moodOpt?.emoji ?? '🫶'}</Text>
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold">{moodOpt ? `Feeling ${moodOpt.label.toLowerCase()} today` : 'How are you feeling?'}</Text>
            <Text variant="caption" muted>{moodOpt ? 'Tap to update your check-in' : 'A quick mood check-in'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Card>
      </Pressable>

      {/* Goals */}
      <View style={[styles.rowBetween, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        <Text variant="label" muted>Today's goals</Text>
        <IconButton icon="add" label="Add goal" onPress={() => router.push('/goal/new')} bg={colors.primarySoft} />
      </View>
      {progress.goals.length === 0 ? (
        <Card alt>
          <Text variant="bodyBold">No goals for today yet</Text>
          <Text muted style={{ marginTop: 4 }}>Small steps count. Add one thing you'd like to do.</Text>
          <Button title="Add a goal" onPress={() => router.push('/goal/new')} style={{ marginTop: spacing.md }} />
        </Card>
      ) : (
        progress.goals.map((g, i) => (
          <Animated.View key={g.id} entering={FadeInDown.delay(i * 40).duration(300)}>
            <GoalRow
              goal={g}
              done={progress.isDone(g.id)}
              streak={streakFor(g.id)}
              onToggle={() => (progress.isDone(g.id) ? undo(g.id) : complete(g.id))}
              onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })}
            />
          </Animated.View>
        ))
      )}

      {progress.goals.length > 0 && (
        <Button
          title={remaining.length === 0 ? 'All done for today 🎉' : `Complete ${remaining.length} remaining goal${remaining.length === 1 ? '' : 's'}`}
          fullWidth
          size="lg"
          disabled={remaining.length === 0}
          onPress={async () => {
            for (const g of remaining) await complete(g.id);
          }}
          style={{ marginTop: spacing.md }}
        />
      )}

      <View style={styles.quick}>
        <QuickAction icon="leaf" label="Activities" color="#8FD3B6" onPress={() => router.push('/activity')} />
        <QuickAction icon="create" label="Journal" color="#F5A3B5" onPress={() => router.push('/journal/new')} />
        <QuickAction icon="stats-chart" label="Progress" color="#8EC5E8" onPress={() => router.push('/progress')} />
        <QuickAction icon="calendar" label="Calendar" color="#B8A9E8" onPress={() => router.push('/calendar')} />
      </View>
    </Screen>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.qa, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.qaIcon, { backgroundColor: color + '33' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text variant="caption" style={{ fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  coin: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  petWrap: { alignItems: 'center', marginTop: spacing.sm },
  bubble: { marginTop: -10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, maxWidth: '85%' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  quick: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  qa: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: 6 },
  qaIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
