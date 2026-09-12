import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Card, Button, ProgressBar, IconButton, Icon, IconTile } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { GoalRow } from '@/components/goals/GoalRow';
import { usePetStore } from '@/store/petStore';
import { useGoalStore } from '@/store/goalStore';
import { useProfileStore } from '@/store/profileStore';
import { useMoodStore } from '@/store/moodStore';
import { useAdventureStore, formatDuration, phaseOf, progressOf, remainingMs } from '@/store/adventureStore';
import { useAdventureClock } from '@/hooks/useAdventureClock';
import { Environment } from '@/components/pet/Environment';
import { useTodayProgress } from '@/hooks/useToday';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, radius, shadows } from '@/theme';
import { getGreeting } from '@/utils/date';
import { levelFromXp, MAX_ENERGY } from '@/utils/leveling';
import { MOOD_LABEL, MOOD_ICON, petLine } from '@/utils/petMood';
import { MOOD_OPTIONS } from '@/data/prompts';
import { adventureById } from '@/data/adventures';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const pet = usePetStore((s) => s.pet);
  const profile = useProfileStore((s) => s.profile);
  const complete = useGoalStore((s) => s.complete);
  const undo = useGoalStore((s) => s.undo);
  const streakFor = useGoalStore((s) => s.streakFor);
  const overall = useGoalStore((s) => s.overallStreak());
  const todayMood = useMoodStore((s) => s.todays());
  const runs = useAdventureStore((s) => s.runs);
  useAdventureStore((s) => s.tick);
  const now = useAdventureClock();
  const progress = useTodayProgress();
  const [lineSeed, setLineSeed] = useState(0);

  const lvl = useMemo(() => levelFromXp(pet?.xp ?? 0), [pet?.xp]);
  if (!pet) return null;

  const remaining = progress.goals.filter((g) => !progress.isDone(g.id));
  const activeRun = runs.find((r) => phaseOf(r, now) !== 'idle');
  const phase = phaseOf(activeRun, now);
  const activeLoc = activeRun ? adventureById(activeRun.locationId) : null;
  const away = phase === 'on_adventure' || phase === 'returned';
  const resting = phase === 'resting';
  const moodOpt = todayMood ? MOOD_OPTIONS.find((m) => m.value === todayMood.value) : null;
  const stageSize = Math.max(240, Math.min(width - spacing.lg * 2, 420));

  return (
    <Screen>
      {/* Header: greeting + profile/settings */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" muted>{profile?.displayName ? `Hi ${profile.displayName}` : 'Welcome back'}</Text>
          <Text variant="display">{getGreeting()}</Text>
        </View>
        <Pressable onPress={() => router.push('/pet-shop' as any)} accessibilityRole="button" accessibilityLabel={`${profile?.coins ?? 0} coins`} style={[styles.coin, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="coins" size={16} color="#D69C2A" strokeWidth={2.4} />
          <Text variant="bodyBold" style={{ marginLeft: 6 }}>{profile?.coins ?? 0}</Text>
        </Pressable>
        <View style={{ marginLeft: spacing.sm }}>
          <IconButton icon="settings" label="Settings" variant="outline" onPress={() => router.push('/settings')} />
        </View>
      </View>

      {/* Stage: pet on environment */}
      <Animated.View entering={FadeIn.duration(400)} style={[styles.stage, shadows.card, { width: stageSize, alignSelf: 'center' }]}>
        {away && activeRun && activeLoc ? (
          /* Pet is NOT home: show the empty house + an "away" card */
          <View style={{ borderRadius: 36, overflow: 'hidden' }}>
            <Environment id={pet.environmentId} size={stageSize} />
            <View style={[styles.awayCard, { backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.94)', borderColor: colors.border }]}>
              <IconTile name={activeLoc.icon} color={activeLoc.color} size={48} />
              <Text variant="bodyBold" center style={{ marginTop: spacing.sm }}>{pet.name} is away on an adventure</Text>
              <Text variant="caption" muted center>{phase === 'returned' ? `Just got back from ${activeLoc.name}!` : `Exploring ${activeLoc.name} · back in ${formatDuration(remainingMs(activeRun.endsAt, now))}`}</Text>
              <ProgressBar value={phase === 'returned' ? 1 : progressOf(activeRun.startedAt, activeRun.endsAt, now)} color={activeLoc.color} height={8} style={{ alignSelf: 'stretch', marginTop: spacing.sm }} />
              <Button title={phase === 'returned' ? 'Welcome them home' : 'Check in'} size="sm" onPress={() => router.push('/adventure')} style={{ marginTop: spacing.sm }} />
            </View>
          </View>
        ) : (
          <PetAvatar pet={pet} size={stageSize} state={resting ? 'SLEEPING' : undefined} interactive={!resting} onPet={() => setLineSeed((s) => s + 1)} />
        )}
        {/* Level badge */}
        <View style={[styles.levelBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="level" size={14} color="#F4C24B" fill="#F4C24B" />
          <Text variant="caption" style={{ marginLeft: 4, fontFamily: 'Nunito_800ExtraBold' }}>Lv {lvl.level}</Text>
        </View>
        {/* Speech bubble / resting label */}
        {!away && (
          <View style={[styles.bubble, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
            {resting && activeRun ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="moon" size={14} color="#8EC5E8" />
                <Text variant="caption" center>Resting... {formatDuration(remainingMs(activeRun.restEndsAt, now))} left</Text>
              </View>
            ) : (
              <Text variant="caption" center numberOfLines={2}>{petLine(pet.mood, lineSeed)}</Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Name + mood + bars */}
      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.rowBetween}>
          <Pressable onPress={() => router.push('/(tabs)/pet')} accessibilityRole="button" accessibilityLabel={`${pet.name}, open pet`} style={{ flex: 1 }}>
            <Text variant="title">{pet.name}</Text>
            <View style={styles.moodRow}>
              <Icon name={MOOD_ICON[pet.mood]} size={14} color={colors.primary} />
              <Text variant="caption" muted style={{ marginLeft: 5 }}>{MOOD_LABEL[pet.mood]}</Text>
            </View>
          </Pressable>
          <IconButton icon="shop" label="Customize" bg={colors.primarySoft} onPress={() => router.push('/(tabs)/pet')} />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <Bar icon="energy" label="Energy" right={`${pet.energy}/${MAX_ENERGY}`} value={pet.energy / MAX_ENERGY} color="#6DBF9C" />
          <Bar icon="xp" label={`Level ${lvl.level}`} right={`${lvl.current}/${lvl.needed} XP`} value={lvl.progress} color="#B8A9E8" />
        </View>
        <View style={styles.miniStats}>
          <Mini icon="streak" color="#E76F51" value={`${overall}`} label="day streak" />
          <Mini icon="check-circle" color="#6DBF9C" value={`${progress.completed}/${progress.total}`} label="today" />
          <Mini icon="friendship" color="#F5A3B5" value={`${pet.friendship}%`} label="friendship" />
        </View>
      </Card>

      {/* Contextual banner: adventure or mood */}
      {activeLoc && away ? (
        <Banner icon={activeLoc.icon} color={activeLoc.color} title={phase === 'returned' ? `${pet.name} is back from ${activeLoc.name}` : `${pet.name} is exploring ${activeLoc.name}`} sub={phase === 'returned' ? 'See what they found' : 'Tap to check in'} onPress={() => router.push('/adventure')} />
      ) : activeLoc && resting && activeRun ? (
        <Banner icon="moon" color="#8EC5E8" title={`${pet.name} is resting after ${activeLoc.name}`} sub={`Ready for another trip in ${formatDuration(remainingMs(activeRun.restEndsAt, now))}`} onPress={() => router.push('/adventure')} />
      ) : pet.energy >= 25 ? (
        <Banner icon="compass" color="#F4A261" title="Enough energy for an adventure" sub={`Send ${pet.name} exploring`} onPress={() => router.push('/adventure')} />
      ) : null}
      <Banner icon={moodOpt?.icon ?? 'mood-add'} color={moodOpt?.color ?? '#8EC5E8'} title={moodOpt ? `Feeling ${moodOpt.label.toLowerCase()} today` : 'How are you feeling?'} sub={moodOpt ? 'Tap to update your check-in' : 'A 10-second mood check-in'} onPress={() => router.push('/mood')} />

      {/* Today's goals */}
      <View style={[styles.rowBetween, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        <View>
          <Text variant="heading">Today's goals</Text>
          <Text variant="caption" muted>{remaining.length === 0 && progress.total > 0 ? 'All done. Rest is productive too.' : `${remaining.length} to go`}</Text>
        </View>
        <IconButton icon="add" label="Add goal" onPress={() => router.push('/goal/new')} bg={colors.primarySoft} />
      </View>
      {progress.goals.length === 0 ? (
        <Card alt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <IconTile name="custom" color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyBold">No goals for today yet</Text>
              <Text variant="caption" muted>Small steps count. Add one thing.</Text>
            </View>
          </View>
          <Button title="Add a goal" icon="add" onPress={() => router.push('/goal/new')} style={{ marginTop: spacing.md }} />
        </Card>
      ) : (
        progress.goals.map((g, i) => (
          <Animated.View key={g.id} entering={FadeInDown.delay(i * 40).duration(300)}>
            <GoalRow goal={g} done={progress.isDone(g.id)} streak={streakFor(g.id)} onToggle={() => (progress.isDone(g.id) ? undo(g.id) : complete(g.id))} onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })} />
          </Animated.View>
        ))
      )}

      {progress.goals.length > 0 && remaining.length > 0 && (
        <Button title={`Complete ${remaining.length} remaining`} icon="check-all" fullWidth size="lg" onPress={async () => { for (const g of remaining) await complete(g.id); }} style={{ marginTop: spacing.md }} />
      )}

      <View style={styles.quick}>
        <QuickAction icon="mindfulness" label="Activities" color="#6DBF9C" onPress={() => router.push('/activity')} />
        <QuickAction icon="journal" label="Journal" color="#F5A3B5" onPress={() => router.push('/journal/new')} />
        <QuickAction icon="stats" label="Progress" color="#8EC5E8" onPress={() => router.push('/progress')} />
        <QuickAction icon="calendar" label="Calendar" color="#B8A9E8" onPress={() => router.push('/calendar')} />
      </View>
    </Screen>
  );
}

function Bar({ icon, label, right, value, color }: { icon: IconName; label: string; right: string; value: number; color: string }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={[styles.rowBetween, { marginBottom: 4 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name={icon} size={14} color={color} strokeWidth={2.6} />
          <Text variant="caption" style={{ marginLeft: 5, fontFamily: 'Nunito_700Bold' }}>{label}</Text>
        </View>
        <Text variant="caption" muted>{right}</Text>
      </View>
      <ProgressBar value={value} color={color} height={10} />
    </View>
  );
}

function Mini({ icon, color, value, label }: { icon: IconName; color: string; value: string; label: string }) {
  return (
    <View style={styles.mini}>
      <Icon name={icon} size={16} color={color} strokeWidth={2.4} />
      <Text variant="bodyBold" style={{ marginLeft: 6 }}>{value}</Text>
      <Text variant="caption" muted style={{ marginLeft: 4 }}>{label}</Text>
    </View>
  );
}

function Banner({ icon, color, title, sub, onPress }: { icon: IconName; color: string; title: string; sub: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={styles.banner}>
      <IconTile name={icon} color={color} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyBold" numberOfLines={1}>{title}</Text>
        <Text variant="caption" muted>{sub}</Text>
      </View>
      <Icon name="forward" size={20} color={colors.textMuted} />
    </Card>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: IconName; label: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.qa, shadows.soft, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      <LinearGradient colors={[color + '40', color + '18']} style={styles.qaIcon}>
        <Icon name={icon} size={22} color={color} />
      </LinearGradient>
      <Text variant="caption" style={{ fontFamily: 'Nunito_700Bold' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  coin: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 42, borderRadius: radius.pill, borderWidth: 1 },
  stage: { borderRadius: 36 },
  awayCard: { position: 'absolute', left: '10%', right: '10%', top: '22%', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, ...shadows.card },
  levelBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  bubble: { position: 'absolute', bottom: 14, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, maxWidth: '80%', ...shadows.soft },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  miniStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, flexWrap: 'wrap', gap: 6 },
  mini: { flexDirection: 'row', alignItems: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  quick: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  qa: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: 6 },
  qaIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
