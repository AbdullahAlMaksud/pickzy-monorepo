import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Services } from '@/services';
import { useServices } from '@/services/ServicesProvider';
import { useAppStore } from '@/store/appStore';

export interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Runs a read against SQLite and keeps it fresh: it reloads when the screen regains focus and
 * whenever any write bumps `dataVersion`. Old data stays visible while reloading (no flicker).
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
  const requestId = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(() => {
    const id = ++requestId.current;
    setState((s) => (s.loading ? s : { ...s, loading: true }));
    loaderRef
      .current(services)
      .then((data) => {
        if (id === requestId.current) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (id === requestId.current) {
          setState((s) => ({
            data: s.data,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, ...deps]);

  useEffect(() => {
    run();
  }, [run, dataVersion]);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run]),
  );

  useEffect(
    () => () => {
      requestId.current += 1; // ignore results after unmount
    },
    [],
  );

  return { ...state, reload: run };
}
