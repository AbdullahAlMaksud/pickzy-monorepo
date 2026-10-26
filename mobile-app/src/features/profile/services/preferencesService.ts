import { createPreferencesRepository } from '@/database/repositories/preferencesRepository';
import type { Database } from '@/database/types';
import { isFontKey } from '@/theme/typography';
import {
  DEFAULT_PREFERENCES,
  LOCALES,
  PREFERENCE_KEYS,
  THEME_PREFERENCES,
  type AppPreferences,
  type LocaleCode,
  type ThemePreference,
} from '../types';

export const MAX_DISPLAY_NAME = 40;

export function normalizeDisplayName(raw: string): string {
  return Array.from(raw.normalize('NFC').replace(/\s+/g, ' ').trim())
    .slice(0, MAX_DISPLAY_NAME)
    .join('');
}

const asBool = (value: string | undefined, fallback: boolean) =>
  value === '1' ? true : value === '0' ? false : fallback;

/** Turns raw stored strings into valid preferences; unknown/corrupt values fall back to defaults. */
export function parsePreferences(raw: Record<string, string>): AppPreferences {
  const theme = raw[PREFERENCE_KEYS.theme];
  const font = raw[PREFERENCE_KEYS.font];
  const locale = raw[PREFERENCE_KEYS.locale];
  const photo = raw[PREFERENCE_KEYS.photoUri];
  return {
    displayName: normalizeDisplayName(raw[PREFERENCE_KEYS.displayName] ?? ''),
    photoUri: photo ? photo : null,
    theme: (THEME_PREFERENCES as readonly string[]).includes(theme)
      ? (theme as ThemePreference)
      : DEFAULT_PREFERENCES.theme,
    font: isFontKey(font) ? font : DEFAULT_PREFERENCES.font,
    locale: (LOCALES as readonly string[]).includes(locale)
      ? (locale as LocaleCode)
      : DEFAULT_PREFERENCES.locale,
    haptics: asBool(raw[PREFERENCE_KEYS.haptics], DEFAULT_PREFERENCES.haptics),
    confetti: asBool(raw[PREFERENCE_KEYS.confetti], DEFAULT_PREFERENCES.confetti),
  };
}

function serialize<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): string {
  if (typeof value === 'boolean') return value ? '1' : '0';
  return value === null ? '' : String(value);
}

export function createPreferencesService(db: Database, clock: () => number = Date.now) {
  return {
    /** Whether anything has ever been saved (used to pick a first-run language from the device). */
    async hasStoredLocale(): Promise<boolean> {
      return (await createPreferencesRepository(db).get(PREFERENCE_KEYS.locale)) !== null;
    },

    async load(): Promise<AppPreferences> {
      return parsePreferences(await createPreferencesRepository(db).getAll());
    },

    async save<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): Promise<void> {
      const repo = createPreferencesRepository(db);
      const storageKey = PREFERENCE_KEYS[key];
      if (value === null || value === '') {
        if (key === 'photoUri') {
          await repo.remove(storageKey);
          return;
        }
      }
      await repo.set(storageKey, serialize(key, value), clock());
    },

    async saveMany(values: Partial<AppPreferences>): Promise<void> {
      await db.transaction(async (tx) => {
        const repo = createPreferencesRepository(tx);
        const now = clock();
        for (const key of Object.keys(values) as (keyof AppPreferences)[]) {
          const value = values[key];
          const storageKey = PREFERENCE_KEYS[key];
          if (key === 'photoUri' && !value) await repo.remove(storageKey);
          else await repo.set(storageKey, serialize(key, value as never), now);
        }
      });
    },
  };
}

export type PreferencesService = ReturnType<typeof createPreferencesService>;
