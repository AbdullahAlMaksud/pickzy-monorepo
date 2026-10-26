import { FONT_OPTIONS, containsBengali, isFontKey, resolveFontFamily, familyNamesFor } from '@/theme/typography';
import { FONT_FILES } from '@/theme/fontAssets';
import * as fs from 'fs';
import * as path from 'path';

describe('font resolution', () => {
  it('uses the selected Latin family in English', () => {
    expect(resolveFontFamily({ fontKey: 'poppins', locale: 'en', weight: 'bold' })).toBe('Poppins_700Bold');
    expect(resolveFontFamily({ fontKey: 'opensans', locale: 'en', weight: 'regular' })).toBe('OpenSans_400Regular');
  });

  it('always uses a Bengali-capable family in the Bengali UI', () => {
    for (const f of FONT_OPTIONS) {
      expect(resolveFontFamily({ fontKey: f.key, locale: 'bn', weight: 'medium' })).toBe('NotoSansBengali_500Medium');
    }
  });

  it('switches to the Bengali family for Bengali text inside the English UI (imported names)', () => {
    expect(resolveFontFamily({ fontKey: 'inter', locale: 'en', weight: 'regular', text: 'নুসরাত' })).toBe('NotoSansBengali_400Regular');
    expect(resolveFontFamily({ fontKey: 'inter', locale: 'en', weight: 'regular', text: 'Nusrat' })).toBe('Inter_400Regular');
    expect(containsBengali('Mixed নাম')).toBe(true);
  });

  it('validates font keys', () => {
    expect(isFontKey('inter')).toBe(true);
    expect(isFontKey('comic')).toBe(false);
    expect(isFontKey(undefined)).toBe(false);
  });

  it('every font option has all four weights registered and bundled on disk', () => {
    const prefixes = [...FONT_OPTIONS.map((f) => f.prefix), 'NotoSansBengali'];
    for (const prefix of prefixes) {
      for (const family of familyNamesFor(prefix)) {
        expect(FONT_FILES[prefix]).toHaveProperty(family);
        expect(fs.existsSync(path.resolve(__dirname, '../../src/assets/fonts', `${family}.ttf`))).toBe(true);
      }
    }
  });
});
