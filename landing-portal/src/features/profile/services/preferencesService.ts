import type { PickzyDatabase } from '@/lib/db/database';
import { DEFAULT_PREFERENCES, LOCALES, type AppPreferences, type LocaleCode } from '../types';

export const MAX_DISPLAY_NAME = 40;

export function normalizeDisplayName(raw: string): string {
  return Array.from(raw.normalize('NFC').replace(/\s+/g, ' ').trim())
    .slice(0, MAX_DISPLAY_NAME)
    .join('');
}

/** Turns raw stored values into valid preferences; unknown or corrupt values fall back to defaults. */
export function parsePreferences(raw: Partial<Record<keyof AppPreferences, unknown>>): AppPreferences {
  const locale = raw.locale;
  const photo = raw.photoDataUrl;
  return {
    displayName: normalizeDisplayName(typeof raw.displayName === 'string' ? raw.displayName : ''),
    photoDataUrl: typeof photo === 'string' && photo.startsWith('data:image/') ? photo : null,
    locale: (LOCALES as readonly unknown[]).includes(locale) ? (locale as LocaleCode) : DEFAULT_PREFERENCES.locale,
    confetti: typeof raw.confetti === 'boolean' ? raw.confetti : DEFAULT_PREFERENCES.confetti,
  };
}

export function createPreferencesService(db: PickzyDatabase) {
  return {
    async hasStoredLocale(): Promise<boolean> {
      return (await db.preferences.get('locale')) !== undefined;
    },

    async load(): Promise<AppPreferences> {
      const rows = await db.preferences.toArray();
      return parsePreferences(Object.fromEntries(rows.map((r) => [r.key, r.value])));
    },

    async save<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): Promise<void> {
      await db.preferences.put({ key, value });
    },

    async saveMany(values: Partial<AppPreferences>): Promise<void> {
      await db.preferences.bulkPut(Object.entries(values).map(([key, value]) => ({ key, value })));
    },
  };
}

export type PreferencesService = ReturnType<typeof createPreferencesService>;
