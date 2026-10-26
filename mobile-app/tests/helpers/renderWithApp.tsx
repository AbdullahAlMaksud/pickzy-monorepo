import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from '@/i18n';
import { createServices, type Services } from '@/services';
import { ServicesProvider } from '@/services/ServicesProvider';
import { useAppStore } from '@/store/appStore';
import { DEFAULT_PREFERENCES, type LocaleCode } from '@/features/profile/types';
import { createTestDatabase, sequenceRng } from './testDatabase';

export async function setupApp(options: { locale?: LocaleCode; rng?: () => number } = {}) {
  const testDb = await createTestDatabase();
  const services: Services = createServices(testDb.db, { rng: options.rng ?? sequenceRng([0]) });
  await initI18n(options.locale ?? 'en');
  await i18n.changeLanguage(options.locale ?? 'en');
  useAppStore.setState({
    ready: true,
    preferences: { ...DEFAULT_PREFERENCES, locale: options.locale ?? 'en', haptics: false },
    dataVersion: 0,
  });
  return { services, testDb };
}

export async function renderWithApp(ui: ReactElement, services: Services) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ServicesProvider services={services}>{ui}</ServicesProvider>
    </I18nextProvider>
  );
}
