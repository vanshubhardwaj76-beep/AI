import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { JournalEntry, JournalKind } from '@/types';
import { Button, Chip, Input, Text, Card } from '@/components/ui';
import { JOURNAL_PROMPTS } from '@/data/prompts';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

const KINDS: { id: JournalKind; label: string; emoji: string }[] = [
  { id: 'daily', label: 'Daily', emoji: '📓' },
  { id: 'gratitude', label: 'Gratitude', emoji: '💛' },
  { id: 'mood', label: 'Mood note', emoji: '🫶' },
  { id: 'free', label: 'Thoughts', emoji: '💭' },
];

interface Props {
  initial?: JournalEntry | null;
  initialPrompt?: string | null;
  onSubmit: (v: { kind: JournalKind; title: string; body: string; prompt: string | null }) => Promise<void>;
  onDelete?: () => void;
}

export function JournalEditor({ initial, initialPrompt, onSubmit, onDelete }: Props) {
  const { colors } = useTheme();
  const [kind, setKind] = useState<JournalKind>(initial?.kind ?? (initialPrompt ? 'daily' : 'free'));
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [prompt, setPrompt] = useState<string | null>(initial?.prompt ?? initialPrompt ?? null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!body.trim()) return setErr('Write a little something first');
    if (body.length > 5000) return setErr('Keep it under 5000 characters');
    setErr(null);
    setBusy(true);
    try {
      await onSubmit({ kind, title: title.trim(), body: body.trim(), prompt });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <View style={styles.kinds}>
        {KINDS.map((k) => <Chip key={k.id} label={k.label} emoji={k.emoji} selected={kind === k.id} onPress={() => setKind(k.id)} />)}
      </View>

      <Text variant="label" muted style={{ marginBottom: spacing.sm }}>Need a nudge?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {JOURNAL_PROMPTS.map((p) => (
          <Chip key={p} label={p} selected={prompt === p} onPress={() => setPrompt(prompt === p ? null : p)} />
        ))}
      </ScrollView>
      {prompt && (
        <Card tint={colors.primarySoft} style={{ marginBottom: spacing.md }}>
          <Text variant="bodyBold">{prompt}</Text>
        </Card>
      )}

      <Input label="Title (optional)" value={title} onChangeText={setTitle} placeholder="Give it a name" maxLength={80} />
      <Input label="Entry" value={body} onChangeText={setBody} multiline placeholder="Start writing…" error={err} style={{ minHeight: 180 }} autoFocus={!initial} />
      <Button title={initial ? 'Save changes' : 'Save entry'} size="lg" fullWidth loading={busy} onPress={submit} />
      {onDelete && <Button title="Delete entry" variant="ghost" fullWidth onPress={onDelete} style={{ marginTop: spacing.md }} />}
    </View>
  );
}

const styles = StyleSheet.create({ kinds: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm } });
