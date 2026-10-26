import * as Localization from 'expo-localization';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { initializeDatabase } from '@/database';
import { DatabaseError } from '@/database/types';
import { initI18n, pickInitialLocale } from '@/i18n';
import { createServices, type Services } from '@/services';
import { useAppStore } from '@/store/appStore';
import { applyThemePreference } from '@/theme/applyTheme';
import { loadFontsForKey, preloadRemainingFonts } from '@/theme/fonts';

export type BootState =
  | { status: 'loading' }
  | { status: 'ready'; services: Services }
  | { status: 'error'; code: 'database' | 'newerSchema' | 'generic' };

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Opens SQLite, loads saved preferences, sets language/theme/fonts, then reveals the app. */
export function useBootstrap(): { state: BootState; retry: () => void } {
  const [state, setState] = useState<BootState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await initializeDatabase();
        const services = createServices(db);
        const hasLocale = await services.preferences.hasStoredLocale();
        const loaded = await services.preferences.load();
        const deviceLanguage = Localization.getLocales()[0]?.languageCode;
        const locale = pickInitialLocale(hasLocale ? loaded.locale : null, deviceLanguage);
        const preferences = { ...loaded, locale };

        await initI18n(locale);
        applyThemePreference(preferences.theme);
        await loadFontsForKey(preferences.font);

        if (cancelled) return;
        useAppStore.getState().hydrate(preferences);
        useAppStore.getState().setReady(true);
        setState({ status: 'ready', services });
        preloadRemainingFonts();
      } catch (error) {
        if (cancelled) return;
        // i18n may not be ready: the error screen uses plain English fallbacks via initI18n below.
        await initI18n('en').catch(() => undefined);
        const code =
          error instanceof DatabaseError
            ? error.code === 'NEWER_SCHEMA'
              ? 'newerSchema'
              : 'database'
            : 'generic';
        setState({ status: 'error', code });
      } finally {
        if (!cancelled) void SplashScreen.hideAsync().catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
