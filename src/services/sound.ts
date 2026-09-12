import { Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Tiny synthesised UI sounds (no audio assets needed, fully original).
 * Uses WebAudio on web; native falls back to haptics only, keeping the bundle
 * light. Swap in expo-audio + your own sound files here when you have them.
 */
type Tone = 'complete' | 'levelup' | 'tap' | 'reward';

const PATTERNS: Record<Tone, { freq: number; dur: number; delay: number }[]> = {
  tap: [{ freq: 660, dur: 0.05, delay: 0 }],
  complete: [
    { freq: 523, dur: 0.1, delay: 0 },
    { freq: 659, dur: 0.1, delay: 0.1 },
    { freq: 784, dur: 0.18, delay: 0.2 },
  ],
  reward: [
    { freq: 784, dur: 0.08, delay: 0 },
    { freq: 988, dur: 0.14, delay: 0.09 },
  ],
  levelup: [
    { freq: 523, dur: 0.1, delay: 0 },
    { freq: 659, dur: 0.1, delay: 0.1 },
    { freq: 784, dur: 0.1, delay: 0.2 },
    { freq: 1047, dur: 0.3, delay: 0.3 },
  ],
};

let ctx: AudioContext | null = null;

export function playSound(tone: Tone) {
  if (!useSettingsStore.getState().settings.soundEnabled) return;
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    const now = ctx!.currentTime;
    for (const p of PATTERNS[tone]) {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = p.freq;
      gain.gain.setValueAtTime(0.0001, now + p.delay);
      gain.gain.exponentialRampToValueAtTime(0.12, now + p.delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.delay + p.dur);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + p.delay);
      osc.stop(now + p.delay + p.dur + 0.02);
    }
  } catch {
    // audio is best-effort
  }
}
