'use client';

import { useCallback } from 'react';
import i18n from '@/i18n';
import { useServices } from '@/lib/services-context';
import { useAppStore } from '@/store/appStore';
import type { AppPreferences } from '../types';

/** Reads preferences from the store and saves changes to IndexedDB first, then to the store. */
export function usePreferences() {
  const { preferences: service } = useServices();
  const preferences = useAppStore((s) => s.preferences);
  const patch = useAppStore((s) => s.patchPreferences);

  const saveMany = useCallback(
    async (values: Partial<AppPreferences>) => {
      await service.saveMany(values);
      patch(values);
      if (values.locale) await i18n.changeLanguage(values.locale);
    },
    [service, patch],
  );

  return { preferences, saveMany };
}
