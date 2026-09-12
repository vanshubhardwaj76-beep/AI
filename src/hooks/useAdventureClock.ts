import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAdventureStore } from '@/store/adventureStore';

/**
 * Keeps the adventure state machine honest while the app is open:
 * re-syncs from timestamps on foreground and every 30s, and exposes a ticking
 * `now` (1s) for countdowns. Startup sync happens in adventureStore.load().
 */
export function useAdventureClock(tickMs = 1000) {
  const [now, setNow] = useState(Date.now());
  const sync = useAdventureStore((s) => s.sync);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), tickMs);
    const s = setInterval(() => { void sync(); }, 30_000);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') { setNow(Date.now()); void sync(); } });
    return () => { clearInterval(t); clearInterval(s); sub.remove(); };
  }, [sync, tickMs]);
  return now;
}
