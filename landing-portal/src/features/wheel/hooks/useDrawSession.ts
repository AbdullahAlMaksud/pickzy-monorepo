'use client';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';

/**
 * Loads a draw (session, roster snapshot, winners). Each load first reconciles the draw with the
 * project's current participant list and tells the person if that changed anything.
 */
export function useDrawSession(drawId: number) {
  const { t } = useTranslation('wheel');
  const query = useAsyncQuery(
    async (s) => {
      // `useAsyncQuery` always runs the newest loader, so `t` is never stale here.
      const outcome = await s.draws.syncRoster(drawId);
      if (outcome === 'resnapshotted' || outcome === 'reset' || outcome === 'detached') toast.info(t(`sync.${outcome}`));
      return s.draws.load(drawId);
    },
    [drawId],
  );
  return { snapshot: query.data ?? null, loading: query.loading, error: query.error, reload: query.reload };
}
