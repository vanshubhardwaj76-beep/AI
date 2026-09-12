import type { IconName } from '@/components/ui/Icon';
export const JOURNAL_PROMPTS = [
  'What was one good thing about today?',
  "What's something you're looking forward to?",
  'How are you feeling right now?',
  'What is something kind you did for yourself recently?',
  'What would make tomorrow a little easier?',
  'Who made you smile this week?',
  'What is one thing you learned today?',
  'Describe a small moment of peace you noticed.',
];

export const MOOD_OPTIONS: { value: 1 | 2 | 3 | 4 | 5; label: string; icon: IconName; color: string }[] = [
  { value: 5, label: 'Great', icon: 'mood-great', color: '#8FD3B6' },
  { value: 4, label: 'Good', icon: 'mood-good', color: '#B7DDA3' },
  { value: 3, label: 'Okay', icon: 'mood-okay', color: '#F9DC7A' },
  { value: 2, label: 'Not great', icon: 'mood-low', color: '#F4A261' },
  { value: 1, label: 'Rough', icon: 'mood-rough', color: '#B8A9E8' },
];

export const MOOD_RESPONSES: Record<1 | 2 | 3 | 4 | 5, { message: string; suggestion: string; activityId: string }> = {
  5: { message: "That's wonderful! Let's bottle some of this feeling.", suggestion: 'Capture it in a quick gratitude note?', activityId: 'gratitude' },
  4: { message: 'Glad today is treating you well.', suggestion: 'A short stretch could keep the good energy going.', activityId: 'stretch' },
  3: { message: 'Okay is perfectly okay. Thanks for checking in.', suggestion: 'A one-minute breathing reset might lift things a little.', activityId: 'one_minute_breath' },
  2: { message: "I'm sorry today feels heavy. You're not alone in it.", suggestion: 'Try grounding for one minute — no pressure.', activityId: 'grounding' },
  1: { message: 'Rough days are real. Be gentle with yourself right now.', suggestion: 'Slow breathing can help your body settle. I will be right here.', activityId: 'slow_breathing' },
};

export const COMPLETION_CHEERS = [
  'Nice work!',
  'You did it!',
  'Look at you go!',
  'One step closer.',
  'That counts. Big time.',
  'Proud of you!',
];

export const ENCOURAGEMENTS = [
  "You've got this!",
  'Proud of you!',
  'Keep going, friend.',
  'Sending good vibes',
  'One step at a time.',
];
