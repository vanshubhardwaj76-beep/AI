import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Header, useToast } from '@/components/ui';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { useJournalStore } from '@/store/journalStore';

export default function NewEntry() {
  const router = useRouter();
  const toast = useToast();
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const add = useJournalStore((s) => s.add);
  return (
    <Screen>
      <Header title="New entry" back />
      <JournalEditor
        initialPrompt={prompt ?? null}
        onSubmit={async (v) => {
          await add(v);
          toast('Entry saved', 'success');
          router.back();
        }}
      />
    </Screen>
  );
}
