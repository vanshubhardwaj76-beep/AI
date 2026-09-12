import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Header, Text, Card, Button, Input } from '@/components/ui';
import { MoodPicker } from '@/components/home/MoodPicker';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { AwayBadge, usePetAway } from '@/components/adventure/AwayStage';
import { useMoodStore } from '@/store/moodStore';
import { usePetStore } from '@/store/petStore';
import { MoodValue } from '@/types';
import { MOOD_RESPONSES } from '@/data/prompts';
import { activityById } from '@/data/activities';
import { spacing } from '@/theme';

export default function MoodCheckIn() {
  const router = useRouter();
  const existing = useMoodStore((s) => s.todays());
  const checkIn = useMoodStore((s) => s.checkIn);
  const pet = usePetStore((s) => s.pet);
  const { away } = usePetAway();
  const [value, setValue] = useState<MoodValue | null>(existing?.value ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!value) return;
    setBusy(true);
    await checkIn(value, note);
    setBusy(false);
    setSaved(true);
  };

  const response = value ? MOOD_RESPONSES[value] : null;
  const suggested = response ? activityById(response.activityId) : null;

  return (
    <Screen>
      <Header title="How are you feeling?" back subtitle="There are no wrong answers." />
      {!saved ? (
        <>
          <MoodPicker value={value} onSelect={setValue} />
          <View style={{ height: spacing.lg }} />
          <Input label="Add a note (optional)" value={note} onChangeText={setNote} multiline placeholder="What's on your mind?" maxLength={500} />
          <Button title={existing ? 'Update check-in' : 'Save check-in'} size="lg" fullWidth disabled={!value} loading={busy} onPress={save} />
        </>
      ) : (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.center}>
          {away && pet ? <AwayBadge pet={pet} size={140} /> : <PetAvatar pet={pet} size={180} showEnvironment={false} />}
          <Card style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}>
            <Text variant="heading" center>{response?.message}</Text>
            {suggested && (
              <>
                <Text muted center style={{ marginTop: spacing.sm }}>{response?.suggestion}</Text>
                <Button title={`Try ${suggested.title} · ${Math.round(suggested.durationSeconds / 60) || 1} min`} fullWidth onPress={() => router.replace({ pathname: '/activity/[id]', params: { id: suggested.id } })} style={{ marginTop: spacing.md }} />
              </>
            )}
            <Button title="View mood history" variant="ghost" fullWidth onPress={() => router.replace('/mood-history')} style={{ marginTop: spacing.sm }} />
            <Button title="Done" variant="secondary" fullWidth onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
          </Card>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center' } });
