import type { FontKey } from '@/theme/typography';

export type ThemePreference = 'system' | 'light' | 'dark' | 'colorful';
export type LocaleCode = 'en' | 'bn';
export type FontSizePreference = 'small' | 'medium' | 'large';

export interface AppPreferences {
  displayName: string;
  /** file:// URI of the profile photo inside the app's own storage, or null. */
  photoUri: string | null;
  theme: ThemePreference;
  font: FontKey;
  fontSize: FontSizePreference;
  locale: LocaleCode;
  haptics: boolean;
  confetti: boolean;
  termsAccepted: boolean;
}

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark', 'colorful'];
export const LOCALES: readonly LocaleCode[] = ['en', 'bn'];
export const FONT_SIZE_PREFERENCES: readonly FontSizePreference[] = ['small', 'medium', 'large'];

export const DEFAULT_PREFERENCES: AppPreferences = {
  displayName: '',
  photoUri: null,
  theme: 'system',
  font: 'opensans',
  fontSize: 'medium',
  locale: 'en',
  haptics: true,
  confetti: true,
  termsAccepted: false,
};

export const PREFERENCE_KEYS = {
  displayName: 'profile.displayName',
  photoUri: 'profile.photoUri',
  theme: 'ui.theme',
  font: 'ui.font',
  fontSize: 'ui.fontSize',
  locale: 'ui.locale',
  haptics: 'ui.haptics',
  confetti: 'ui.confetti',
  termsAccepted: 'app.termsAccepted',
} as const satisfies Record<keyof AppPreferences, string>;
