import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Share } from 'react-native';
import { Screen, Header, Text, Card, Button, Input, Sheet, EmptyState, useToast, Chip } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { useFriendStore } from '@/store/friendStore';
import { useProfileStore } from '@/store/profileStore';
import { friendsService } from '@/services/friends';
import { speciesInfo } from '@/data/pets';
import { ENCOURAGEMENTS } from '@/data/prompts';
import { Friend } from '@/types';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

const REACTIONS = ['👏', '💛', '🌟', '🌱', '🫶'];

export default function FriendsScreen() {
  const toast = useToast();
  const { colors } = useTheme();
  const friends = useFriendStore((s) => s.friends);
  const addByCode = useFriendStore((s) => s.addByCode);
  const remove = useFriendStore((s) => s.remove);
  const encourage = useFriendStore((s) => s.encourage);
  const react = useFriendStore((s) => s.react);
  const myCode = useProfileStore((s) => s.profile?.friendCode ?? '');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Friend | null>(null);
  const [message, setMessage] = useState('');

  const add = async () => {
    setBusy(true);
    const r = await addByCode(code);
    setBusy(false);
    if (!r.ok) return setErr(r.reason ?? 'Could not add');
    setErr(null);
    setCode('');
    toast('Friend added 💛', 'success');
  };

  return (
    <Screen>
      <Header title="Friends" back subtitle="Cheer each other on — no leaderboards here" />
      <Card tint={colors.primarySoft}>
        <Text variant="label" muted>Your friend code</Text>
        <View style={styles.codeRow}>
          <Text variant="display">{myCode}</Text>
          <Button title="Share" size="sm" variant="secondary" onPress={() => Share.share({ message: `Add me on Pipkin! My friend code is ${myCode}` })} />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Input label="Add a friend by code" value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="ABC123" autoCapitalize="characters" maxLength={6} error={err} hint={friendsService.sampleCodes.length ? `Try a sample code: ${friendsService.sampleCodes.join(', ')}` : undefined} />
        <Button title="Add friend" fullWidth loading={busy} disabled={code.length !== 6} onPress={add} />
      </Card>

      <Text variant="label" muted style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Your friends</Text>
      {friends.length === 0 ? (
        <EmptyState emoji="🌼" title="No friends yet" body="Add someone's code to see their companion and send encouragement." />
      ) : (
        friends.map((f) => (
          <Pressable key={f.id} onPress={() => setOpen(f)} accessibilityRole="button">
            <Card style={styles.friend}>
              <PetAvatar species={f.species} mood="happy" size={70} showEnvironment={false} interactive={false} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyBold">{f.name}</Text>
                <Text variant="caption" muted>{f.petName} the {speciesInfo(f.species).name} · Lv {f.level}</Text>
                {f.reactions.length > 0 && <Text variant="caption" style={{ marginTop: 2 }}>{f.reactions.slice(0, 5).map((r) => r.emoji).join(' ')}</Text>}
              </View>
              <Text variant="caption" muted>Say hi →</Text>
            </Card>
          </Pressable>
        ))
      )}

      <Sheet visible={!!open} onClose={() => setOpen(null)} title={open ? `${open.petName} & ${open.name}` : ''}>
        {open && (
          <View>
            <View style={{ alignItems: 'center' }}>
              <PetAvatar species={open.species} mood="excited" size={180} showEnvironment={false} interactive={false} />
            </View>
            <Text variant="label" muted style={{ marginBottom: spacing.sm }}>Send a reaction</Text>
            <View style={styles.reactRow}>
              {REACTIONS.map((r) => (
                <Pressable key={r} onPress={async () => { await react(open.id, r); toast(`Sent ${r}`, 'success'); setOpen({ ...open, reactions: [{ emoji: r, at: '' }, ...open.reactions] }); }} style={[styles.react, { backgroundColor: colors.cardAlt }]} accessibilityRole="button" accessibilityLabel={`React ${r}`}>
                  <Text style={{ fontSize: 26 }}>{r}</Text>
                </Pressable>
              ))}
            </View>
            <Text variant="label" muted style={{ marginVertical: spacing.sm }}>Send encouragement</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {ENCOURAGEMENTS.map((e) => <Chip key={e} label={e} selected={message === e} onPress={() => setMessage(e)} />)}
            </View>
            <Input value={message} onChangeText={setMessage} placeholder="Or write your own…" maxLength={140} />
            <Button title="Send" fullWidth disabled={!message.trim()} onPress={async () => { await encourage(open.id, message.trim()); toast(`Sent to ${open.name} 💌`, 'success'); setMessage(''); setOpen(null); }} />
            <Button title="Remove friend" variant="ghost" fullWidth onPress={async () => { await remove(open.id); setOpen(null); }} style={{ marginTop: spacing.sm }} />
          </View>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  friend: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  reactRow: { flexDirection: 'row', justifyContent: 'space-between' },
  react: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
});
