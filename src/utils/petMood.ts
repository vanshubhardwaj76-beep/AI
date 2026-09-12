import type { PetMood } from '@/types';

export interface MoodInputs {
  energy: number;
  completedToday: number;
  totalToday: number;
  hoursSinceSeen: number;
  hour: number;
  recentlyCompleted: boolean;
  recentlyLeveled: boolean;
}

export function computePetMood(i: MoodInputs): PetMood {
  if (i.recentlyLeveled) return 'proud';
  if (i.recentlyCompleted) return 'excited';
  if (i.hour >= 22 || i.hour < 6) return 'sleepy';
  if (i.energy < 15) return 'tired';
  if (i.totalToday > 0 && i.completedToday === i.totalToday) return 'proud';
  if (i.hoursSinceSeen > 36) return 'curious';
  if (i.completedToday > 0) return 'happy';
  if (i.energy > 70) return 'excited';
  if (i.hour < 10) return 'calm';
  return 'happy';
}

export const MOOD_LABEL: Record<PetMood, string> = {
  happy: 'Feeling happy',
  excited: 'Bursting with energy',
  sleepy: 'Getting sleepy',
  curious: 'Feeling curious',
  proud: 'Feeling proud',
  calm: 'Feeling calm',
  tired: 'A little tired',
};

export const MOOD_EMOJI: Record<PetMood, string> = {
  happy: '♡',
  excited: '✦',
  sleepy: '☾',
  curious: '?',
  proud: '★',
  calm: '~',
  tired: '·',
};

const PET_LINES: Record<PetMood, string[]> = {
  happy: ["Today feels like a good day.", "I'm glad you're here.", "Let's take it one small step at a time."],
  excited: ["Ooh, what should we do next?", "I've got so much energy!", "An adventure sounds fun right now."],
  sleepy: ["Rest is part of growing, too.", "Yawn... a calm evening is nice.", "Let's wind down together."],
  curious: ["Welcome back! I missed our adventures.", "I wonder what today will bring.", "What's on your mind?"],
  proud: ["Look at what you did!", "You showed up today. That matters.", "I'm proud of us."],
  calm: ["Deep breath in... and out.", "No rush. We've got time.", "A gentle start is still a start."],
  tired: ["A little self-care would recharge me.", "Even tiny goals count.", "Let's do something small together."],
};

export function petLine(mood: PetMood, seed = 0): string {
  const lines = PET_LINES[mood];
  return lines[Math.abs(seed) % lines.length];
}
