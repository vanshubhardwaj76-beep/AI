import React, { useMemo } from 'react';
import { useMoodStore } from '@/store/moodStore';
import { MOOD_OPTIONS } from '@/data/prompts';
import { MonthCalendar } from './MonthCalendar';
import type { DayMarks } from './MonthCalendar';

export function MoodCalendar({ selected, onSelect }: { selected?: string | null; onSelect?: (k: string) => void }) {
  const entries = useMoodStore((s) => s.entries);
  const marks = useMemo(() => {
    const m: Record<string, DayMarks> = {};
    for (const e of entries) m[e.date] = { moodColor: MOOD_OPTIONS.find((o) => o.value === e.value)?.color };
    return m;
  }, [entries]);
  return <MonthCalendar marks={marks} selected={selected} onSelect={onSelect} />;
}
