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
      const expected = f.key === 'anekbangla' ? 'AnekBangla_500Medium' : 'NotoSansBengali_500Medium';
      expect(resolveFontFamily({ fontKey: f.key, locale: 'bn', weight: 'medium' })).toBe(expected);
    }
  });

  it('pairs Anek Bangla for headings/display and Noto Sans Bengali for body in Bengali UI', () => {
    expect(resolveFontFamily({ fontKey: 'inter', locale: 'bn', weight: 'bold', variant: 'display' })).toBe('AnekBangla_700Bold');
    expect(resolveFontFamily({ fontKey: 'inter', locale: 'bn', weight: 'semibold', variant: 'heading' })).toBe('AnekBangla_600SemiBold');
    expect(resolveFontFamily({ fontKey: 'inter', locale: 'bn', weight: 'medium', variant: 'title' })).toBe('AnekBangla_500Medium');
    expect(resolveFontFamily({ fontKey: 'inter', locale: 'bn', weight: 'regular', variant: 'body' })).toBe('NotoSansBengali_400Regular');
  });

  it('switches to the Bengali family for Bengali text inside the English UI (imported names)', () => {
    expect(resolveFontFamily({ fontKey: 'inter', locale: 'en', weight: 'regular', text: 'নুসরাত' })).toBe('NotoSansBengali_400Regular');
    expect(resolveFontFamily({ fontKey: 'inter', locale: 'en', weight: 'regular', text: 'Nusrat' })).toBe('Inter_400Regular');
    expect(containsBengali('Mixed নাম')).toBe(true);
  });

  it('validates font keys', () => {
    expect(isFontKey('inter')).toBe(true);
    expect(isFontKey('anekbangla')).toBe(true);
    expect(isFontKey('notosansbengali')).toBe(true);
    expect(isFontKey('comic')).toBe(false);
    expect(isFontKey(undefined)).toBe(false);
  });

  it('every font option has all four weights registered and bundled on disk', () => {
    const prefixes = [...new Set([...FONT_OPTIONS.map((f) => f.prefix), 'NotoSansBengali', 'AnekBangla'])];
    for (const prefix of prefixes) {
      for (const family of familyNamesFor(prefix)) {
        expect(FONT_FILES[prefix]).toHaveProperty(family);
        expect(fs.existsSync(path.resolve(__dirname, '../../src/assets/fonts', `${family}.ttf`))).toBe(true);
      }
    }
  });
});
