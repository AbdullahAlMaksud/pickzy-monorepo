import { FONT_OPTIONS, containsBengali, isFontKey, resolveFontFamily, familyNamesFor } from '@/theme/typography';
import { FONT_FILES } from '@/theme/fontAssets';
import * as fs from 'fs';
import * as path from 'path';

describe('font resolution', () => {
  it('uses the selected Latin family in English', () => {
    expect(resolveFontFamily({ fontKey: 'playfair', locale: 'en', weight: 'bold' })).toBe('PlayfairDisplay_700Bold');
    expect(resolveFontFamily({ fontKey: 'opensans', locale: 'en', weight: 'regular' })).toBe('OpenSans_400Regular');
  });

  it('always uses a Bengali-capable family in the Bengali UI', () => {
    for (const f of FONT_OPTIONS) {
      const expected =
        f.key === 'purno'
          ? 'Purno_500Medium'
          : 'AnekBangla_500Medium';
      expect(resolveFontFamily({ fontKey: f.key, locale: 'bn', weight: 'medium' })).toBe(expected);
    }
  });

  it('pairs Anek Bangla for headings/display and body in Bengali UI', () => {
    expect(resolveFontFamily({ fontKey: 'opensans', locale: 'bn', weight: 'bold', variant: 'display' })).toBe('AnekBangla_700Bold');
    expect(resolveFontFamily({ fontKey: 'opensans', locale: 'bn', weight: 'semibold', variant: 'heading' })).toBe('AnekBangla_600SemiBold');
    expect(resolveFontFamily({ fontKey: 'opensans', locale: 'bn', weight: 'medium', variant: 'title' })).toBe('AnekBangla_500Medium');
    expect(resolveFontFamily({ fontKey: 'opensans', locale: 'bn', weight: 'regular', variant: 'body' })).toBe('AnekBangla_400Regular');
  });

  it('switches to the Bengali family for Bengali text inside the English UI (imported names)', () => {
    expect(resolveFontFamily({ fontKey: 'opensans', locale: 'en', weight: 'regular', text: 'নুসরাত' })).toBe('AnekBangla_400Regular');
    expect(resolveFontFamily({ fontKey: 'opensans', locale: 'en', weight: 'regular', text: 'Nusrat' })).toBe('OpenSans_400Regular');
    expect(containsBengali('Mixed নাম')).toBe(true);
  });

  it('validates font keys', () => {
    expect(isFontKey('playfair')).toBe(true);
    expect(isFontKey('opensans')).toBe(true);
    expect(isFontKey('anekbangla')).toBe(true);
    expect(isFontKey('purno')).toBe(true);
    expect(isFontKey('comic')).toBe(false);
    expect(isFontKey('inter')).toBe(false);
    expect(isFontKey('poppins')).toBe(false);
    expect(isFontKey(undefined)).toBe(false);
  });

  it('every font option has all four weights registered and bundled on disk', () => {
    const prefixes = [...new Set(FONT_OPTIONS.map((f) => f.prefix))];
    for (const prefix of prefixes) {
      for (const family of familyNamesFor(prefix)) {
        expect(FONT_FILES[prefix]).toHaveProperty(family);
        expect(fs.existsSync(path.resolve(__dirname, '../../public/fonts', `${family}.ttf`))).toBe(true);
      }
    }
  });
});
