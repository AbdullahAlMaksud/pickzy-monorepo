import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LocaleCode } from '@/features/profile/types';
import { formatNumber } from '@/lib/format';

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
  en: { common: enCommon, home: enHome, projects: enProjects, wheel: enWheel, history: enHistory, profile: enProfile },
  bn: { common: bnCommon, home: bnHome, projects: bnProjects, wheel: bnWheel, history: bnHistory, profile: bnProfile },
} as const;

export const SUPPORTED_LOCALES: readonly LocaleCode[] = ['en', 'bn'];

/** Language strategy: 1) the language the user saved, 2) the browser language if supported, 3) English. */
export function pickInitialLocale(saved: string | null | undefined, browserLanguage: string | null | undefined): LocaleCode {
  if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) return saved as LocaleCode;
  const browser = browserLanguage?.toLowerCase().split(/[-_]/)[0];
  if (browser && (SUPPORTED_LOCALES as readonly string[]).includes(browser)) return browser as LocaleCode;
  return 'en';
}

let initPromise: Promise<unknown> | null = null;

/** Initializes i18next once (client side). Later calls only switch the language. */
export function initI18n(locale: LocaleCode): Promise<unknown> {
  if (!initPromise) {
    initPromise = i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: locale,
        fallbackLng: 'en',
        supportedLngs: [...SUPPORTED_LOCALES],
        ns: [...NAMESPACES],
        defaultNS: 'common',
        interpolation: { escapeValue: false },
        returnNull: false,
        react: { useSuspense: false },
      })
      .then(() => {
        // `{{count, localeNumber}}` renders Bengali digits in Bengali while plural rules still
        // receive the real number.
        i18n.services.formatter?.add('localeNumber', (value, lng) => formatNumber(Number(value), lng ?? 'en'));
      });
  } else if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  return initPromise;
}

export default i18n;
