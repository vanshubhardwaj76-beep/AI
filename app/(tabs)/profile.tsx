import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Screen, Header, Text, Card, Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { useProfileStore } from '@/store/profileStore';
import { usePetStore } from '@/store/petStore';
import { useGoalStore } from '@/store/goalStore';
import { useFriendStore } from '@/store/friendStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { levelTitle } from '@/utils/leveling';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const pet = usePetStore((s) => s.pet);
  const streak = useGoalStore((s) => s.overallStreak());
  const completions = useGoalStore((s) => s.completions.length);
  const friends = useFriendStore((s) => s.friends.length);

  const rows: { icon: IconName; label: string; hint?: string; href: Href; color: string }[] = [
    { icon: 'stats', label: 'Progress', hint: `${completions} goals completed`, href: '/progress', color: '#8EC5E8' },
    { icon: 'calendar', label: 'Calendar', href: '/calendar', color: '#B8A9E8' },
    { icon: 'mood-good', label: 'Mood history', href: '/mood-history', color: '#F9DC7A' },
    { icon: 'mindfulness', label: 'Self-care activities', href: '/activity', color: '#8FD3B6' },
    { icon: 'users', label: 'Friends', hint: friends ? `${friends} friend${friends === 1 ? '' : 's'}` : 'Send encouragement', href: '/friends', color: '#F5A3B5' },
    { icon: 'profile', label: 'Account', hint: profile?.authProvider === 'guest' ? 'Guest · tap to sign in & sync' : profile?.email ?? 'Signed in', href: '/auth', color: '#F4A261' },
    { icon: 'settings', label: 'Settings', href: '/settings', color: '#C9B8A8' },
  ];

  return (
    <Screen>
      <Header title="Profile" />
      <Card style={styles.hero}>
        <PetAvatar pet={pet} size={96} showEnvironment={false} interactive={false} />
        <View style={{ flex: 1 }}>
          <Text variant="title">{profile?.displayName ?? 'Friend'}</Text>
          <Text muted>with {pet?.name} · Level {pet?.level} {levelTitle(pet?.level ?? 1)}</Text>
          <Text variant="caption" muted style={{ marginTop: 4 }}>Friend code: {profile?.friendCode}</Text>
        </View>
      </Card>
      <View style={styles.stats}>
        <Mini icon="streak" color="#E76F51" label="Streak" value={`${streak}`} />
        <Mini icon="coins" color="#D69C2A" label="Coins" value={`${profile?.coins ?? 0}`} />
        <Mini icon="xp" color="#B8A9E8" label="XP" value={`${pet?.xp ?? 0}`} />
      </View>
      {rows.map((r) => (
        <Pressable key={r.label} onPress={() => router.push(r.href)} accessibilityRole="button" style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
          <View style={[styles.icon, { backgroundColor: r.color + '33' }]}>
            <Icon name={r.icon} size={20} color={r.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold">{r.label}</Text>
            {r.hint ? <Text variant="caption" muted>{r.hint}</Text> : null}
          </View>
          <Icon name="forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </Screen>
  );
}

function Mini({ icon, color, label, value }: { icon: IconName; color: string; label: string; value: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md }}>
      <Icon name={icon} size={18} color={color} strokeWidth={2.4} />
      <Text variant="heading" style={{ marginTop: 4 }}>{value}</Text>
      <Text variant="caption" muted>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
