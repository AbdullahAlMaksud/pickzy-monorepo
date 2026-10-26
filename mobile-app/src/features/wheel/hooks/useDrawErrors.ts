import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DrawError } from '../services/drawSessionService';

/** Turns any thrown error into a translated, user-facing message. */
export function useDrawErrorMessage() {
  const { t } = useTranslation(['wheel', 'common']);
  return useCallback(
    (error: unknown): string => {
      if (error instanceof DrawError) return t(`wheel:errors.${error.code}`);
      return t('wheel:errors.UNKNOWN');
    },
    [t],
  );
}
