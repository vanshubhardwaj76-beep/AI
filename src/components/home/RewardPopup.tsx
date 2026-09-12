import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { usePetStore } from '@/store/petStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { Text } from '@/components/ui/Text';
import { playSound } from '@/services/sound';

/** Global reward / level-up popup, driven by petStore.reaction. */
export function RewardPopup() {
  const reaction = usePetStore((s) => s.reaction);
  const clear = usePetStore((s) => s.clearReaction);
  const { colors } = useTheme();

  useEffect(() => {
    if (!reaction) return;
    playSound(reaction.kind === 'levelup' ? 'levelup' : 'complete');
    const t = setTimeout(clear, reaction.kind === 'levelup' ? 3200 : 2200);
    return () => clearTimeout(t);
  }, [reaction, clear]);

  if (!reaction) return null;
  const isLevel = reaction.kind === 'levelup';

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(200)} style={styles.host} pointerEvents="box-none">
      <Pressable onPress={clear} style={StyleSheet.absoluteFill} />
      <Animated.View
        entering={ZoomIn.springify().damping(12)}
        style={[
          styles.card,
          { backgroundColor: isLevel ? colors.primary : colors.card, borderColor: colors.border, shadowColor: colors.shadow },
        ]}
      >
        <Text style={styles.emoji}>{isLevel ? '🎉' : '✨'}</Text>
        <Text variant="title" center color={isLevel ? colors.onPrimary : colors.text}>
          {reaction.title}
        </Text>
        {reaction.subtitle ? (
          <Text variant="caption" center color={isLevel ? colors.onPrimary : colors.textMuted} style={{ marginTop: 2 }}>
            {reaction.subtitle}
          </Text>
        ) : null}
        <View style={styles.rewards}>
          {reaction.xp ? <Pill label={`+${reaction.xp} XP`} color="#B8A9E8" /> : null}
          {reaction.energy ? <Pill label={`+${reaction.energy} Energy`} color="#8FD3B6" /> : null}
          {reaction.coins ? <Pill label={`+${reaction.coins} 🪙`} color="#F9DC7A" /> : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color }]}>
      <Text variant="caption" style={{ color: '#2A1D12', fontWeight: '800' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 900 },
  card: {
    minWidth: 240,
    maxWidth: '80%',
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  rewards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.md, gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
});
