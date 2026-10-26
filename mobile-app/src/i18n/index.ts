import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LocaleCode } from '@/features/profile/types';
import { formatNumber } from '@/utils/format';

import enCommon from './locales/en/common.json';
import enHistory from './locales/en/history.json';
import enHome from './locales/en/home.json';
import enProfile from './locales/en/profile.json';
import enProjects from './locales/en/projects.json';
import enWheel from './locales/en/wheel.json';
import bnCommon from './locales/bn/common.json';
import bnHistory from './locales/bn/history.json';
import bnHome from './locales/bn/home.json';
import bnProfile from './locales/bn/profile.json';
import bnProjects from './locales/bn/projects.json';
import bnWheel from './locales/bn/wheel.json';

export const NAMESPACES = ['common', 'home', 'projects', 'wheel', 'history', 'profile'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const resources = {
  en: {
    common: enCommon,
    home: enHome,
    projects: enProjects,
    wheel: enWheel,
    history: enHistory,
    profile: enProfile,
  },
  bn: {
    common: bnCommon,
    home: bnHome,
    projects: bnProjects,
    wheel: bnWheel,
    history: bnHistory,
    profile: bnProfile,
  },
} as const;

export const SUPPORTED_LOCALES: readonly LocaleCode[] = ['en', 'bn'];

/**
 * Language strategy: 1) the language the user saved, 2) the device language if we support it,
 * 3) English.
 */
export function pickInitialLocale(
  saved: string | null | undefined,
  deviceLanguageCode: string | null | undefined,
): LocaleCode {
  if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) return saved as LocaleCode;
  const device = deviceLanguageCode?.toLowerCase().split(/[-_]/)[0];
  if (device && (SUPPORTED_LOCALES as readonly string[]).includes(device)) return device as LocaleCode;
  return 'en';
}

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      supportedLngs: [...SUPPORTED_LOCALES],
      ns: [...NAMESPACES],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      returnNull: false,
      react: { useSuspense: false },
    });

  // `{{count, localeNumber}}` renders Bengali digits in Bengali while plural rules still
  // receive the real number.
  i18n.services.formatter?.add('localeNumber', (value, lng) =>
    formatNumber(Number(value), lng ?? 'en'),
  );
}

export function initI18n(locale: LocaleCode = 'en'): Promise<unknown> {
  if (i18n.language !== locale) {
    return i18n.changeLanguage(locale);
  }
  return Promise.resolve(i18n);
}

export async function setAppLocale(locale: LocaleCode): Promise<void> {
  await i18n.changeLanguage(locale);
}

export default i18n;
