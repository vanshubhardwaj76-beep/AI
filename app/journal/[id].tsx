import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Header, Card, Text, Button, EmptyState, useToast } from '@/components/ui';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { useJournalStore } from '@/store/journalStore';
import { formatLongDate } from '@/utils/date';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const entry = useJournalStore((s) => s.entries.find((e) => e.id === id));
  const update = useJournalStore((s) => s.update);
  const remove = useJournalStore((s) => s.remove);
  const [editing, setEditing] = useState(false);

  if (!entry) {
    return (
      <Screen>
        <Header title="Journal" back />
        <EmptyState icon="journaling" title="Entry not found" actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const confirmDelete = () => {
    const doIt = async () => {
      await remove(entry.id);
      toast('Entry deleted');
      router.back();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this entry?')) doIt();
    } else {
      Alert.alert('Delete entry?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doIt },
      ]);
    }
  };

  if (editing) {
    return (
      <Screen>
        <Header title="Edit entry" back />
        <JournalEditor
          initial={entry}
          onSubmit={async (v) => {
            await update(entry.id, v);
            toast('Saved', 'success');
            setEditing(false);
          }}
          onDelete={confirmDelete}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={entry.title || 'Entry'} subtitle={formatLongDate(entry.date)} back right={<Button title="Edit" size="sm" variant="secondary" onPress={() => setEditing(true)} />} />
      {entry.prompt ? (
        <Card tint={colors.primarySoft} style={{ marginBottom: spacing.md }}>
          <Text variant="bodyBold">{entry.prompt}</Text>
        </Card>
      ) : null}
      <Card>
        <Text style={{ lineHeight: 26 }}>{entry.body}</Text>
      </Card>
      <Text variant="caption" muted style={{ marginTop: spacing.md }}>
        Written {new Date(entry.createdAt).toLocaleString()}{entry.updatedAt !== entry.createdAt ? ` · edited ${new Date(entry.updatedAt).toLocaleString()}` : ''}
      </Text>
      <Button title="Delete" variant="ghost" onPress={confirmDelete} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}
