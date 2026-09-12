import type { IconName } from '@/components/ui/Icon';
import type { GoalCategory, GoalDifficulty } from '@/types';

export interface GoalTemplate {
  name: string;
  description: string;
  category: GoalCategory;
  icon: string;
  difficulty: GoalDifficulty;
}

export const CATEGORY_INFO: { id: GoalCategory; label: string; icon: IconName }[] = [
  { id: 'exercise', label: 'Exercise', icon: 'exercise' },
  { id: 'sleep', label: 'Sleep', icon: 'sleep' },
  { id: 'study', label: 'Study', icon: 'study' },
  { id: 'hydration', label: 'Hydration', icon: 'hydration' },
  { id: 'mindfulness', label: 'Mental wellness', icon: 'mindfulness' },
  { id: 'productivity', label: 'Productivity', icon: 'productivity' },
  { id: 'journaling', label: 'Journaling', icon: 'journaling' },
  { id: 'routine', label: 'Healthy routines', icon: 'routine' },
  { id: 'custom', label: 'Custom', icon: 'custom' },
];

export const GOAL_TEMPLATES: Record<GoalCategory, GoalTemplate[]> = {
  exercise: [
    { name: 'Stretch for 5 minutes', description: 'Loosen up your body.', category: 'exercise', icon: 'stretch', difficulty: 'easy' },
    { name: 'Take a 15-minute walk', description: 'Fresh air counts double.', category: 'exercise', icon: 'walk', difficulty: 'medium' },
    { name: 'Work out', description: 'Any movement you enjoy.', category: 'exercise', icon: 'exercise', difficulty: 'hard' },
  ],
  sleep: [
    { name: 'In bed by 11pm', description: 'Give tomorrow-you a gift.', category: 'sleep', icon: 'sleep', difficulty: 'medium' },
    { name: 'No screens 30 min before bed', description: 'Let your brain wind down.', category: 'sleep', icon: 'moon', difficulty: 'medium' },
  ],
  study: [
    { name: 'Study for 30 minutes', description: 'Focused, phone away.', category: 'study', icon: 'study', difficulty: 'medium' },
    { name: 'Review notes', description: 'Ten minutes is enough.', category: 'study', icon: 'journaling', difficulty: 'easy' },
  ],
  hydration: [
    { name: 'Drink a glass of water', description: 'Right when you wake up.', category: 'hydration', icon: 'hydration', difficulty: 'easy' },
    { name: 'Drink 8 glasses of water', description: 'Keep a bottle nearby.', category: 'hydration', icon: 'hydration', difficulty: 'medium' },
  ],
  mindfulness: [
    { name: 'Breathe for 1 minute', description: 'Slow and steady.', category: 'mindfulness', icon: 'mindfulness', difficulty: 'easy' },
    { name: 'Mood check-in', description: 'Notice how you feel.', category: 'mindfulness', icon: 'mood-good', difficulty: 'easy' },
    { name: 'Meditate', description: 'Even 3 minutes helps.', category: 'mindfulness', icon: 'garden', difficulty: 'medium' },
  ],
  productivity: [
    { name: 'Plan tomorrow', description: 'Three priorities, max.', category: 'productivity', icon: 'productivity', difficulty: 'easy' },
    { name: 'Do the hardest task first', description: 'Eat the frog.', category: 'productivity', icon: 'energy', difficulty: 'hard' },
    { name: 'Tidy your space', description: '5 minutes of reset.', category: 'productivity', icon: 'home', difficulty: 'easy' },
  ],
  journaling: [
    { name: 'Write in your journal', description: 'A few lines is plenty.', category: 'journaling', icon: 'journaling', difficulty: 'easy' },
    { name: 'Gratitude list', description: 'Three small good things.', category: 'journaling', icon: 'heart', difficulty: 'easy' },
  ],
  routine: [
    { name: 'Make your bed', description: 'Tiny win to start the day.', category: 'routine', icon: 'sleep', difficulty: 'easy' },
    { name: 'Eat breakfast', description: 'Fuel up.', category: 'routine', icon: 'eat', difficulty: 'easy' },
    { name: 'Step outside', description: 'Sunlight on your face.', category: 'routine', icon: 'sun', difficulty: 'easy' },
  ],
  custom: [],
};
