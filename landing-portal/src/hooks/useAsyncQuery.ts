'use client';

import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { useServices } from '@/lib/services-context';
import type { Services } from '@/lib/services';
import { useAppStore } from '@/store/appStore';

export interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Runs a read against IndexedDB and keeps it fresh: it reloads when the tab becomes visible again and
 * whenever any write bumps `dataVersion`. Old data stays on screen while reloading (no flicker).
 * `deps` are the values the loader depends on (compared by value).
 */
export function useAsyncQuery<T>(
  loader: (services: Services) => Promise<T>,
  deps: readonly unknown[] = [],
): QueryState<T> {
  const services = useServices();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: Error | null }>({
    data: undefined,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const load = useEffectEvent(() => loader(services));
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState((s) => ({
            data: s.data,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [services, depsKey, dataVersion, tick]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setTick((t) => t + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
