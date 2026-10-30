'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Keeps `<html lang>` in step with the current language (screen readers and Bengali typography). */
export function LanguageSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.language?.startsWith('bn') ? 'bn' : 'en';
  }, [i18n.language]);
  return null;
}
