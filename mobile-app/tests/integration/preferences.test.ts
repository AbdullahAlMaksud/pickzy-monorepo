import { DEFAULT_PREFERENCES } from '@/features/profile/types';
import { createPreferencesService, normalizeDisplayName, parsePreferences, MAX_DISPLAY_NAME } from '@/features/profile/services/preferencesService';
import { createPreferencesRepository } from '@/database/repositories/preferencesRepository';
import { createTestDatabase, reopenTestDatabase } from '../helpers/testDatabase';

describe('preferences', () => {
  it('starts with defaults when nothing is stored', async () => {
    const { db } = await createTestDatabase();
    const service = createPreferencesService(db);
    expect(await service.load()).toEqual(DEFAULT_PREFERENCES);
    expect(await service.hasStoredLocale()).toBe(false);
  });

  it('persists every preference across an app restart', async () => {
    const first = await createTestDatabase();
    const service = createPreferencesService(first.db);
    await service.saveMany({
      displayName: '  আব্দুল্লাহ   ভাই ',
      photoUri: 'file:///data/profile/avatar-1.jpg',
      theme: 'dark',
      font: 'poppins',
      locale: 'bn',
      haptics: false,
      confetti: false,
    });

    const reopened = await reopenTestDatabase(first.export());
    const loaded = await createPreferencesService(reopened.db).load();
    expect(loaded).toEqual({
      displayName: 'আব্দুল্লাহ ভাই',
      photoUri: 'file:///data/profile/avatar-1.jpg',
      theme: 'dark',
      font: 'poppins',
      locale: 'bn',
      haptics: false,
      confetti: false,
    });
    expect(await createPreferencesService(reopened.db).hasStoredLocale()).toBe(true);
  });

  it('saves single values and clears the photo reference', async () => {
    const { db } = await createTestDatabase();
    const service = createPreferencesService(db);
    await service.save('theme', 'colorful');
    await service.save('photoUri', 'file:///x.jpg');
    await service.save('photoUri', null);
    const loaded = await service.load();
    expect(loaded.theme).toBe('colorful');
    expect(loaded.photoUri).toBeNull();
    expect(await createPreferencesRepository(db).get('profile.photoUri')).toBeNull();
  });

  it('falls back to defaults for corrupt or unknown stored values', () => {
    const loaded = parsePreferences({ 'ui.theme': 'neon', 'ui.font': 'comic', 'ui.locale': 'fr', 'ui.haptics': 'maybe', 'profile.displayName': 'x'.repeat(200) });
    expect(loaded.theme).toBe(DEFAULT_PREFERENCES.theme);
    expect(loaded.font).toBe(DEFAULT_PREFERENCES.font);
    expect(loaded.locale).toBe(DEFAULT_PREFERENCES.locale);
    expect(loaded.haptics).toBe(true);
    expect(Array.from(loaded.displayName)).toHaveLength(MAX_DISPLAY_NAME);
  });

  it('normalizes the display name', () => {
    expect(normalizeDisplayName('  Ab   Cd ')).toBe('Ab Cd');
  });
});
