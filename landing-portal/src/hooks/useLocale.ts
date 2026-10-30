'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatOrdinal,
  formatRelativeDate,
  formatRelativeDateTime,
  formatTime,
} from '@/lib/format';

/** Locale-aware formatters bound to the current language (Bengali digits, dates, ordinals). */
export function useLocale() {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith('bn') ? 'bn' : 'en';
  return {
    locale,
    number: useCallback((n: number) => formatNumber(n, locale), [locale]),
    ordinal: useCallback((n: number) => formatOrdinal(n, locale), [locale]),
    date: useCallback((ts: number) => formatDate(ts, locale), [locale]),
    time: useCallback((ts: number) => formatTime(ts, locale), [locale]),
    dateTime: useCallback((ts: number) => formatDateTime(ts, locale), [locale]),
    relativeDate: useCallback((ts: number) => formatRelativeDate(ts, locale), [locale]),
    relativeDateTime: useCallback((ts: number) => formatRelativeDateTime(ts, locale), [locale]),
  };
}
