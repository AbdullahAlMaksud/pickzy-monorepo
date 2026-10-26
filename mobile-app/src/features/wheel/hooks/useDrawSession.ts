import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useServices } from '@/services/ServicesProvider';
import { notifyDataChanged } from '@/store/appStore';
import { showToast } from '@/store/toastStore';
import type { DrawSnapshot } from '../types';

export interface DrawSessionState {
  snapshot: DrawSnapshot | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<DrawSnapshot | null>;
}

/**
 * Loads a draw and keeps it consistent with the project's participant list every time the screen
 * gains focus (e.g. coming back from participant editing). Reports what the sync did via toasts.
 */
export function useDrawSession(drawId: number, options: { sync?: boolean } = {}): DrawSessionState {
  const { sync = true } = options;
  const { draws } = useServices();
  const { t } = useTranslation('wheel');
  const [state, setState] = useState<{ snapshot: DrawSnapshot | null; loading: boolean; error: Error | null }>({
    snapshot: null,
    loading: true,
    error: null,
  });
  const alive = useRef(true);
  const detachedNotified = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      const snapshot = await draws.load(drawId);
      if (alive.current) setState({ snapshot, loading: false, error: null });
      return snapshot;
    } catch (error) {
      if (alive.current) {
        setState((s) => ({ ...s, loading: false, error: error instanceof Error ? error : new Error(String(error)) }));
      }
      return null;
    }
  }, [draws, drawId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (sync) {
          try {
            const outcome = await draws.syncRoster(drawId);
            if (cancelled) return;
            if (outcome === 'reset') showToast(t('sync.reset'), 'info');
            else if (outcome === 'resnapshotted') showToast(t('sync.resnapshotted'), 'info');
            else if (outcome === 'detached' && !detachedNotified.current) {
              detachedNotified.current = true;
              showToast(t('sync.detached'), 'info');
            }
            if (outcome === 'reset' || outcome === 'resnapshotted') notifyDataChanged();
          } catch {
            // a failed sync must not hide the draw: fall through to loading it
          }
        }
        if (!cancelled) await reload();
      })();
      return () => {
        cancelled = true;
      };
    }, [draws, drawId, reload, sync, t]),
  );

  return { ...state, reload };
}
