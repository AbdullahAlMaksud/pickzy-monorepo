import { act, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import i18n, { initI18n } from '@/i18n';
import { DEFAULT_PREFERENCES, type AppPreferences } from '@/features/profile/types';
import { ServicesProvider } from '@/lib/services-context';
import { useAppStore } from '@/store/appStore';
import { createTestApp, type TestApp } from './testServices';

interface RenderAppOptions {
  app?: TestApp;
  locale?: 'en' | 'bn';
  preferences?: Partial<AppPreferences>;
}

/**
 * Renders a screen the way the real app does: real services on a fresh fake IndexedDB, the real
 * translations, and the app store reset to its defaults.
 */
export async function renderApp(ui: ReactElement, options: RenderAppOptions = {}) {
  const app = options.app ?? createTestApp();
  const locale = options.locale ?? 'en';
  await initI18n(locale);
  await act(() => i18n.changeLanguage(locale));
  useAppStore.setState({ ready: true, preferences: { ...DEFAULT_PREFERENCES, ...options.preferences }, dataVersion: 0 });
  const view = render(<ServicesProvider services={app.services}>{ui}</ServicesProvider>);
  return { app, ...view };
}
