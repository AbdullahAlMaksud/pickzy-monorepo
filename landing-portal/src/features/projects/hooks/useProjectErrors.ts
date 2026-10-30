'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_PROJECT_DESCRIPTION, MAX_PROJECT_NAME, type ProjectErrors } from '../validation';

export type ProjectErrorMessages = Partial<Record<keyof ProjectErrors, string>>;

/** Maps validation codes from the service to translated messages. */
export function useProjectErrorMessages() {
  const { t } = useTranslation('projects');
  return useCallback(
    (errors: ProjectErrors): ProjectErrorMessages => ({
      name:
        errors.name === 'REQUIRED'
          ? t('validation.nameRequired')
          : errors.name === 'TOO_LONG'
            ? t('validation.nameTooLong', { max: MAX_PROJECT_NAME })
            : undefined,
      description: errors.description === 'TOO_LONG' ? t('validation.descriptionTooLong', { max: MAX_PROJECT_DESCRIPTION }) : undefined,
      participants: errors.participants === 'EMPTY_LIST' ? t('validation.participantsEmpty') : undefined,
    }),
    [t],
  );
}
