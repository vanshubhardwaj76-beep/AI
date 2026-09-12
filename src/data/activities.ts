import type { Activity } from '@/types';

export const ACTIVITIES: Activity[] = [
  {
    id: 'box_breathing', category: 'breathing', title: 'Box Breathing', icon: 'square-outline',
    description: 'Inhale, hold, exhale, hold — four counts each. Great for steadying nerves.',
    durationSeconds: 64, loop: true, xp: 8, energy: 8,
    steps: [
      { label: 'Breathe in', seconds: 4 },
      { label: 'Hold', seconds: 4 },
      { label: 'Breathe out', seconds: 4 },
      { label: 'Hold', seconds: 4 },
    ],
  },
  {
    id: 'slow_breathing', category: 'breathing', title: 'Slow Breathing', icon: 'water-outline',
    description: 'A longer exhale tells your body it is safe to relax.',
    durationSeconds: 90, loop: true, xp: 8, energy: 8,
    steps: [
      { label: 'Breathe in', seconds: 4 },
      { label: 'Breathe out slowly', seconds: 6 },
    ],
  },
  {
    id: 'one_minute_breath', category: 'breathing', title: '1-Minute Reset', icon: 'timer-outline',
    description: 'Just one minute of noticing your breath. That is all.',
    durationSeconds: 60, loop: true, xp: 5, energy: 5,
    steps: [
      { label: 'In through the nose', seconds: 5 },
      { label: 'Out through the mouth', seconds: 5 },
    ],
  },
  {
    id: 'grounding', category: 'mindfulness', title: '1-Minute Grounding', icon: 'leaf-outline',
    description: 'Feel your feet, notice the room, arrive in the present.',
    durationSeconds: 60, xp: 8, energy: 8,
    steps: [
      { label: 'Feel your feet on the floor', seconds: 15 },
      { label: 'Notice the temperature of the air', seconds: 15 },
      { label: 'Listen for the farthest sound', seconds: 15 },
      { label: 'Take one slow breath', seconds: 15 },
    ],
  },
  {
    id: 'five_senses', category: 'mindfulness', title: 'Five Senses', icon: 'eye-outline',
    description: 'Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.',
    durationSeconds: 150, xp: 12, energy: 10,
    steps: [
      { label: '5 things you can see', seconds: 40 },
      { label: '4 things you can feel', seconds: 35 },
      { label: '3 things you can hear', seconds: 30 },
      { label: '2 things you can smell', seconds: 25 },
      { label: '1 thing you can taste', seconds: 20 },
    ],
  },
  {
    id: 'short_meditation', category: 'mindfulness', title: 'Short Meditation', icon: 'moon-outline',
    description: 'Three minutes of sitting quietly with whatever is here.',
    durationSeconds: 180, xp: 15, energy: 12,
    steps: [
      { label: 'Settle in and close your eyes', seconds: 30 },
      { label: 'Follow your breath', seconds: 60 },
      { label: 'Notice thoughts, let them pass', seconds: 60 },
      { label: 'Gently return to the room', seconds: 30 },
    ],
  },
  {
    id: 'gratitude', category: 'reflection', title: 'Three Good Things', icon: 'heart-outline',
    description: 'Think of three things, big or tiny, that went okay today.',
    durationSeconds: 90, xp: 10, energy: 8,
    steps: [
      { label: 'One good thing', seconds: 30 },
      { label: 'A second good thing', seconds: 30 },
      { label: 'A third good thing', seconds: 30 },
    ],
  },
  {
    id: 'positive_reflection', category: 'reflection', title: 'Positive Reflection', icon: 'sunny-outline',
    description: 'Recall a moment you handled well recently.',
    durationSeconds: 120, xp: 10, energy: 8,
    steps: [
      { label: 'Recall a recent moment you handled well', seconds: 40 },
      { label: 'What strength did you use?', seconds: 40 },
      { label: 'How can you use it again?', seconds: 40 },
    ],
  },
  {
    id: 'journal_prompt', category: 'reflection', title: 'Quick Journal', icon: 'create-outline',
    description: 'Two minutes of free writing about how you feel.',
    durationSeconds: 120, xp: 10, energy: 8,
    steps: [{ label: 'Write freely — no editing', seconds: 120 }],
  },
  {
    id: 'stretch', category: 'movement', title: 'Gentle Stretch', icon: 'body-outline',
    description: 'Neck, shoulders, back and legs. Slow and easy.',
    durationSeconds: 150, xp: 12, energy: 12,
    steps: [
      { label: 'Roll your shoulders', seconds: 30 },
      { label: 'Tilt your neck side to side', seconds: 30 },
      { label: 'Reach up tall, then fold forward', seconds: 30 },
      { label: 'Gentle twist left and right', seconds: 30 },
      { label: 'Shake it out', seconds: 30 },
    ],
  },
  {
    id: 'walk', category: 'movement', title: 'Short Walk', icon: 'walk-outline',
    description: 'A five-minute stroll — outside if you can.',
    durationSeconds: 300, xp: 15, energy: 15,
    steps: [
      { label: 'Start walking at an easy pace', seconds: 120 },
      { label: 'Notice three things around you', seconds: 120 },
      { label: 'Slow down and head back', seconds: 60 },
    ],
  },
  {
    id: 'movement_break', category: 'movement', title: 'Movement Break', icon: 'fitness-outline',
    description: 'Wake your body up with a minute of movement.',
    durationSeconds: 60, xp: 8, energy: 8,
    steps: [
      { label: 'March in place', seconds: 20 },
      { label: 'Arm circles', seconds: 20 },
      { label: 'Gentle squats or knee lifts', seconds: 20 },
    ],
  },
];

export const ACTIVITY_CATEGORIES: { id: Activity['category']; label: string; icon: string; color: string }[] = [
  { id: 'breathing', label: 'Breathing', icon: 'cloud-outline', color: '#8EC5E8' },
  { id: 'mindfulness', label: 'Mindfulness', icon: 'leaf-outline', color: '#8FD3B6' },
  { id: 'reflection', label: 'Reflection', icon: 'heart-outline', color: '#F5A3B5' },
  { id: 'movement', label: 'Movement', icon: 'walk-outline', color: '#F4A261' },
];

export const activityById = (id: string) => ACTIVITIES.find((a) => a.id === id);
