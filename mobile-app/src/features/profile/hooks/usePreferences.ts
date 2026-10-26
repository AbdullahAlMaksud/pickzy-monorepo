import { useCallback } from 'react';
import { setAppLocale } from '@/i18n';
import { useServices } from '@/services/ServicesProvider';
import { useAppStore } from '@/store/appStore';
import { applyThemePreference } from '@/theme/applyTheme';
import { loadFontsForKey } from '@/theme/fonts';
import type { FontKey } from '@/theme/typography';
import type { AppPreferences, LocaleCode, ThemePreference } from '../types';

/**
 * Every setter writes to SQLite FIRST and only then updates the in-memory store and the live
 * theme/language/font, so what the user sees is always what was saved.
 */
export function usePreferences() {
  const { preferences: service } = useServices();
  const preferences = useAppStore((s) => s.preferences);
  const patch = useAppStore((s) => s.patchPreferences);

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      await service.save('theme', theme);
      applyThemePreference(theme);
      patch({ theme });
    },
    [service, patch],
  );

  const setFont = useCallback(
    async (font: FontKey) => {
      await loadFontsForKey(font);
      await service.save('font', font);
      patch({ font });
    },
    [service, patch],
  );

  const setLocale = useCallback(
    async (locale: LocaleCode) => {
      await service.save('locale', locale);
      await setAppLocale(locale);
      patch({ locale });
    },
    [service, patch],
  );

  const setFlag = useCallback(
    async (key: 'haptics' | 'confetti', value: boolean) => {
      await service.save(key, value);
      patch({ [key]: value });
    },
    [service, patch],
  );

  const saveMany = useCallback(
    async (values: Partial<AppPreferences>) => {
      await service.saveMany(values);
      patch(values);
    },
    [service, patch],
  );

  return { preferences, setTheme, setFont, setLocale, setFlag, saveMany };
}
