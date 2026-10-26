import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { useServices } from '@/services/ServicesProvider';
import { notifyDataChanged } from '@/store/appStore';
import { DrawError } from '@/features/wheel/services/drawSessionService';
import { useDrawErrorMessage } from '@/features/wheel/hooks/useDrawErrors';

/**
 * Entry point when a project is tapped: resumes the project's unfinished draw (so an interrupted spin
 * is never lost) or starts a new one, then replaces itself with the spin screen.
 * A project without participants is sent to the participant editor instead.
 */
export function ProjectEntryScreen({ projectId }: { projectId: number }) {
  const { t } = useTranslation(['wheel', 'common']);
  const { draws } = useServices();
  const errorMessage = useDrawErrorMessage();
  const [error, setError] = useState<unknown>(null);
  const started = useRef(false);

  const start = useCallback(async () => {
    setError(null);
    try {
      if (!Number.isInteger(projectId)) throw new DrawError('PROJECT_NOT_FOUND');
      const { drawId } = await draws.startOrResume(projectId);
      notifyDataChanged();
      router.replace(`/draw/${drawId}`);
    } catch (e) {
      if (e instanceof DrawError && e.code === 'NO_PARTICIPANTS') {
        router.replace(`/project/${projectId}/participants`);
        return;
      }
      setError(e);
    }
  }, [draws, projectId]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  return (
    <SafeScreen
      scroll={false}
      header={<ScreenHeader title={t('wheel:title')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
    >
      {error ? (
        <ErrorView
          message={errorMessage(error)}
          onRetry={() => {
            started.current = true;
            void start();
          }}
        />
      ) : (
        <LoadingView label={t('common:loading')} />
      )}
    </SafeScreen>
  );
}
