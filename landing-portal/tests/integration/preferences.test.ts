import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES } from '@/features/profile/types';
import { MAX_DISPLAY_NAME, normalizeDisplayName, parsePreferences } from '@/features/profile/services/preferencesService';
import { createTestApp, reopenTestApp } from '../helpers/testServices';

describe('preferences', () => {
  it('starts with the defaults and reports that no language was saved', async () => {
    const { services } = createTestApp();
    expect(await services.preferences.load()).toEqual(DEFAULT_PREFERENCES);
    expect(await services.preferences.hasStoredLocale()).toBe(false);
  });

  it('saves values and keeps them after the app is reopened', async () => {
    const app = createTestApp();
    await app.services.preferences.saveMany({ displayName: '  Maksud  ', locale: 'bn', confetti: false });
    expect(await app.services.preferences.hasStoredLocale()).toBe(true);

    const { services } = await reopenTestApp(app);
    expect(await services.preferences.load()).toMatchObject({ displayName: 'Maksud', locale: 'bn', confetti: false });
  });

  it('falls back to defaults for corrupt stored values', () => {
    expect(parsePreferences({ locale: 'fr', confetti: 'yes', photoDataUrl: 'javascript:alert(1)', displayName: 42 })).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it('only accepts image data URLs as a profile photo', () => {
    expect(parsePreferences({ photoDataUrl: 'data:image/jpeg;base64,AAAA' }).photoDataUrl).toBe('data:image/jpeg;base64,AAAA');
    expect(parsePreferences({ photoDataUrl: 'https://example.com/a.png' }).photoDataUrl).toBeNull();
  });

  it('normalizes and limits the display name by characters, not bytes', () => {
    expect(normalizeDisplayName('  a   b ')).toBe('a b');
    expect(Array.from(normalizeDisplayName('আ'.repeat(100))).length).toBe(MAX_DISPLAY_NAME);
  });
});
