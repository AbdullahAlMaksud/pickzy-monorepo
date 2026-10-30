'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { initI18n, pickInitialLocale } from '@/i18n';
import { getDatabase } from '@/lib/db/database';
import { createServices, type Services } from '@/lib/services';
import { ServicesProvider } from '@/lib/services-context';
import { useAppStore } from '@/store/appStore';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

/**
 * Opens the local database, loads preferences and sets the language before any screen renders.
 * Everything here runs in the browser: Pickzy has no server and works offline.
 */
export function AppBootstrap({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Services | null>(null);
  const [attempt, setAttempt] = useState(0);
  const ready = useAppStore((s) => s.ready);
  const startupError = useAppStore((s) => s.startupError);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = createServices(getDatabase());
        await next.db.open();
        const preferences = await next.preferences.load();
        const hasSaved = await next.preferences.hasStoredLocale();
        const locale = pickInitialLocale(hasSaved ? preferences.locale : null, navigator.language);
        await initI18n(locale);
        if (cancelled) return;
        document.documentElement.lang = locale;
        setServices(next);
        useAppStore.getState().hydrate({ ...preferences, locale });
      } catch (error) {
        if (!cancelled) {
          await initI18n(pickInitialLocale(null, navigator.language));
          useAppStore.getState().setStartupError(error instanceof Error ? error.message : 'unknown');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (startupError) return <StartupError onRetry={() => setAttempt((n) => n + 1)} />;
  if (!ready || !services) return <LoadingScreen />;
  return <ServicesProvider services={services}>{children}</ServicesProvider>;
}

function StartupError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('common');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">{t('startup.title')}</h1>
      <p className="text-muted-foreground">{t('errors.database')}</p>
      <Button onClick={onRetry}>{t('startup.retry')}</Button>
    </main>
  );
}
