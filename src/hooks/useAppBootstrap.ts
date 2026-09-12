import { useEffect, useState } from 'react';
import { bootstrapStores } from '@/store/bootstrap';

export function useAppBootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    bootstrapStores()
      .then(() => alive && setReady(true))
      .catch((e) => {
        console.error('[bootstrap]', e);
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load your data');
      });
    return () => {
      alive = false;
    };
  }, []);
  return { ready, error };
}
