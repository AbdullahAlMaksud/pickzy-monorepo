import type { FontKey } from '@/theme/typography';

export type ThemePreference = 'system' | 'light' | 'dark' | 'colorful';
export type LocaleCode = 'en' | 'bn';

export interface AppPreferences {
  displayName: string;
  /** file:// URI of the profile photo inside the app's own storage, or null. */
  photoUri: string | null;
  theme: ThemePreference;
  font: FontKey;
  locale: LocaleCode;
  haptics: boolean;
  confetti: boolean;
}

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark', 'colorful'];
export const LOCALES: readonly LocaleCode[] = ['en', 'bn'];

export const DEFAULT_PREFERENCES: AppPreferences = {
  displayName: '',
  photoUri: null,
  theme: 'system',
  font: 'inter',
  locale: 'en',
  haptics: true,
  confetti: true,
};

export const PREFERENCE_KEYS = {
  displayName: 'profile.displayName',
  photoUri: 'profile.photoUri',
  theme: 'ui.theme',
  font: 'ui.font',
  locale: 'ui.locale',
  haptics: 'ui.haptics',
  confetti: 'ui.confetti',
} as const satisfies Record<keyof AppPreferences, string>;
