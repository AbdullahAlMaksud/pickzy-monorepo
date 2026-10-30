'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DrawError } from '../services/drawSessionService';

/** Turns any thrown error into a message in the current language. */
export function useDrawErrorMessage() {
  const { t } = useTranslation('wheel');
  return useCallback(
    (error: unknown): string => {
      if (error instanceof DrawError) return t(`errors.${error.code}`, { defaultValue: t('errors.UNKNOWN') });
      return t('errors.UNKNOWN');
    },
    [t],
  );
}
