import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, Input, Text } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { SPECIES, speciesInfo } from '@/data/pets';
import { CATEGORY_INFO, GOAL_TEMPLATES } from '@/data/goalTemplates';
import type { GoalTemplate } from '@/data/goalTemplates';
import { GoalCategory, PetSpecies } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';
import { categoryColors, spacing, radius } from '@/theme';
import { usePetStore } from '@/store/petStore';
import { useProfileStore } from '@/store/profileStore';
import { useGoalStore } from '@/store/goalStore';
import { required } from '@/utils/validation';

const STEPS = ['welcome', 'pet', 'name', 'focus', 'improve', 'goals'] as const;
type Step = (typeof STEPS)[number];

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const [species, setSpecies] = useState<PetSpecies>('bird');
  const [petName, setPetName] = useState('');
  const [userName, setUserName] = useState('');
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [focus, setFocus] = useState<GoalCategory[]>([]);
  const [improve, setImprove] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]);

  const suggestions = useMemo(() => {
    const cats = focus.length ? focus : (['routine', 'hydration', 'mindfulness'] as GoalCategory[]);
    const out: GoalTemplate[] = [];
    cats.forEach((c) => out.push(...GOAL_TEMPLATES[c].slice(0, 2)));
    return out.slice(0, 8);
  }, [focus]);

  const finish = async (withGoals: boolean) => {
    setBusy(true);
    try {
      const info = speciesInfo(species);
      const pet = usePetStore.getState();
      if (!pet.pet) await pet.create(species, petName.trim() || info.defaultName);
      await useProfileStore.getState().update({
        displayName: userName.trim() || 'Friend',
        focusAreas: focus,
        improvementNote: improve.trim(),
        onboardingComplete: true,
      });
      if (withGoals) {
        const chosen = suggestions.filter((s) => picked.has(s.name));
        await useGoalStore.getState().addMany(
          chosen.map((t) => ({
            name: t.name,
            description: t.description,
            category: t.category,
            frequency: 'daily' as const,
            days: [0, 1, 2, 3, 4, 5, 6],
            reminderTime: null,
            difficulty: t.difficulty,
            icon: t.icon,
            color: categoryColors[t.category],
          })),
        );
      }
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  const proceedFromName = () => {
    const err = required(petName || speciesInfo(species).defaultName, 'Name', 20);
    setNameErr(err);
    if (!err) next();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* progress dots */}
        {step !== 'welcome' && (
          <View style={styles.topBar}>
            <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
              <Text muted>← Back</Text>
            </Pressable>
            <View style={styles.dots}>
              {STEPS.slice(1).map((s, i) => (
                <View key={s} style={[styles.dot, { backgroundColor: i + 1 <= idx ? colors.primary : colors.border }]} />
              ))}
            </View>
            {(step === 'focus' || step === 'improve' || step === 'goals') ? (
              <Pressable onPress={() => finish(false)} hitSlop={12} accessibilityRole="button">
                <Text muted>Skip</Text>
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>
        )}

        {step === 'welcome' && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
            <Logo />
            <Text variant="display" center style={{ marginTop: spacing.xl }}>Pipkin</Text>
            <Text variant="heading" muted center style={{ marginTop: spacing.sm }}>Take care of yourself,{"\n"}and a little friend grows.</Text>
            <View style={{ marginTop: spacing.xxl, alignSelf: 'stretch' }}>
              <Button title="Get Started" size="lg" fullWidth onPress={next} />
            </View>
            <Text variant="caption" muted center style={{ marginTop: spacing.lg }}>No account needed. Your data stays on your device.</Text>
          </Animated.View>
        )}

        {step === 'pet' && (
          <Animated.View key="pet" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text variant="title">Choose your companion</Text>
            <Text muted style={{ marginBottom: spacing.lg }}>You can always customise them later.</Text>
            <View style={styles.preview}>
              <PetAvatar species={species} mood="happy" size={200} showEnvironment={false} interactive={false} />
            </View>
            <View style={styles.speciesGrid}>
              {SPECIES.map((s) => {
                const on = s.id === species;
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setSpecies(s.id)}
                    style={[styles.speciesCard, { backgroundColor: on ? s.bodyColor + '55' : colors.card, borderColor: on ? s.bodyColor : colors.border }]}
                  >
                    <PetAvatar species={s.id} mood="calm" size={64} showEnvironment={false} interactive={false} />
                    <Text variant="bodyBold" center style={{ marginTop: 6 }}>{s.name}</Text>
                    <Text variant="caption" muted center>{s.tagline}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text variant="caption" muted center style={{ marginVertical: spacing.md }}>{speciesInfo(species).personality}</Text>
            <Button title="Continue" size="lg" fullWidth onPress={next} />
          </Animated.View>
        )}

        {step === 'name' && (
          <Animated.View key="name" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text variant="title">Name your {speciesInfo(species).name}</Text>
            <Text muted style={{ marginBottom: spacing.lg }}>Something that makes you smile.</Text>
            <View style={styles.preview}>
              <PetAvatar species={species} mood="curious" size={160} showEnvironment={false} interactive={false} />
            </View>
            <Input label="Pet name" value={petName} onChangeText={setPetName} placeholder={speciesInfo(species).defaultName} maxLength={20} error={nameErr} autoFocus />
            <Input label="And what should we call you? (optional)" value={userName} onChangeText={setUserName} placeholder="Your name" maxLength={30} />
            <Button title="Continue" size="lg" fullWidth onPress={proceedFromName} />
          </Animated.View>
        )}

        {step === 'focus' && (
          <Animated.View key="focus" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text variant="title">What matters most right now?</Text>
            <Text muted style={{ marginBottom: spacing.lg }}>Pick as many as you like.</Text>
            <View style={styles.wrapRow}>
              {CATEGORY_INFO.filter((c) => c.id !== 'custom').map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  emoji={c.emoji}
                  color={categoryColors[c.id]}
                  selected={focus.includes(c.id)}
                  onPress={() => setFocus(focus.includes(c.id) ? focus.filter((x) => x !== c.id) : [...focus, c.id])}
                />
              ))}
            </View>
            <Button title="Continue" size="lg" fullWidth onPress={next} style={{ marginTop: spacing.lg }} />
          </Animated.View>
        )}

        {step === 'improve' && (
          <Animated.View key="improve" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text variant="title">What would you like to improve?</Text>
            <Text muted style={{ marginBottom: spacing.lg }}>In your own words. This is just for you.</Text>
            <Input value={improve} onChangeText={setImprove} multiline placeholder="e.g. I want to feel less rushed in the mornings and drink more water." maxLength={300} />
            <Button title="Continue" size="lg" fullWidth onPress={next} />
          </Animated.View>
        )}

        {step === 'goals' && (
          <Animated.View key="goals" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text variant="title">Let's start small</Text>
            <Text muted style={{ marginBottom: spacing.lg }}>Pick a few gentle goals to begin with. You can change these any time.</Text>
            {suggestions.map((t) => {
              const on = picked.has(t.name);
              return (
                <Pressable
                  key={t.name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    const n = new Set(picked);
                    on ? n.delete(t.name) : n.add(t.name);
                    setPicked(n);
                  }}
                >
                  <Card style={[styles.sugRow, on && { borderColor: categoryColors[t.category], borderWidth: 2 }]}>
                    <View style={[styles.checkbox, { borderColor: categoryColors[t.category], backgroundColor: on ? categoryColors[t.category] : 'transparent' }]}>
                      {on && <Text style={{ color: '#2A1D12', fontWeight: '800' }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyBold">{t.name}</Text>
                      <Text variant="caption" muted>{t.description}</Text>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
            <Button title={picked.size ? `Start with ${picked.size} goal${picked.size === 1 ? '' : 's'}` : 'Start without goals'} size="lg" fullWidth loading={busy} onPress={() => finish(true)} style={{ marginTop: spacing.md }} />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Logo() {
  return (
    <Svg width={140} height={140} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={48} fill="#F4A261" />
      <Circle cx={50} cy={56} r={30} fill="#FFE8CF" />
      <Path d="M36 50 q4 -6 8 0" stroke="#4A3B32" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M56 50 q4 -6 8 0" stroke="#4A3B32" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M44 62 q6 6 12 0" stroke="#4A3B32" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M28 22 l6 -12 l6 12" stroke="#E76F51" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M60 20 l6 -10 l6 10" stroke="#E76F51" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Circle cx={30} cy={60} r={4} fill="#F5A3B5" opacity={0.7} />
      <Circle cx={70} cy={60} r={4} fill="#F5A3B5" opacity={0.7} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, maxWidth: 560, width: '100%', alignSelf: 'center', flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  preview: { alignItems: 'center', marginBottom: spacing.md },
  speciesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  speciesCard: { width: '47%', padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, alignItems: 'center' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap' },
  sugRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
