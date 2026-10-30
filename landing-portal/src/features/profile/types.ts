export type ThemePreference = 'system' | 'light' | 'dark' | 'colorful';
export type LocaleCode = 'en' | 'bn';

export interface AppPreferences {
  displayName: string;
  /** Profile photo as a small data URL (stored in IndexedDB), or null. */
  photoDataUrl: string | null;
  locale: LocaleCode;
  confetti: boolean;
}

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark', 'colorful'];
export const LOCALES: readonly LocaleCode[] = ['en', 'bn'];

export const DEFAULT_PREFERENCES: AppPreferences = {
  displayName: '',
  photoDataUrl: null,
  locale: 'en',
  confetti: true,
};
