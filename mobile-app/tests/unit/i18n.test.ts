import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import renderer from 'react-test-renderer';
import { getI18n, useTranslation } from 'react-i18next';
import { NAMESPACES, resources, pickInitialLocale } from '@/i18n';

type Json = { [key: string]: Json | string };

function flatten(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`),
  );
}

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const baseKey = (k: string) => k.replace(PLURAL_SUFFIX, '');

function keysOf(locale: 'en' | 'bn', ns: string): Set<string> {
  const set = new Set<string>();
  for (const k of flatten((resources[locale] as Record<string, Json>)[ns])) {
    set.add(k);
    set.add(baseKey(k));
  }
  return set;
}

describe('translation files', () => {
  it.each(NAMESPACES)('namespace "%s" has identical keys in English and Bengali', (ns) => {
    const en = flatten((resources.en as Record<string, Json>)[ns]).sort();
    const bn = flatten((resources.bn as Record<string, Json>)[ns]).sort();
    expect(bn).toEqual(en);
  });

  it.each(NAMESPACES)('namespace "%s" has no empty strings', (ns) => {
    for (const locale of ['en', 'bn'] as const) {
      const walk = (obj: Json, trail: string) => {
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string') expect(`${locale}:${trail}${k}:${v.trim() === ''}`).toMatch(/false$/);
          else walk(v, `${trail}${k}.`);
        }
      };
      walk((resources[locale] as Record<string, Json>)[ns], `${ns}.`);
    }
  });

  it('keeps interpolation placeholders identical between languages', () => {
    const placeholders = (s: string) => (s.match(/\{\{\s*(\w+)/g) ?? []).sort().join(',');
    for (const ns of NAMESPACES) {
      const en = (resources.en as Record<string, Json>)[ns];
      const bn = (resources.bn as Record<string, Json>)[ns];
      const get = (o: Json, key: string): string => key.split('.').reduce<Json | string>((acc, p) => (acc as Json)[p], o) as string;
      for (const key of flatten(en)) {
        expect([ns, key, placeholders(get(bn, key))]).toEqual([ns, key, placeholders(get(en, key))]);
      }
    }
  });
});

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listSourceFiles(full);
    return /\.(ts|tsx)$/.test(e.name) ? [full] : [];
  });
}

describe('translation keys used in source code', () => {
  const root = path.resolve(__dirname, '../..');
  const appDir = path.join(root, 'app');
  const files = [
    ...listSourceFiles(path.join(root, 'src')),
    ...(fs.existsSync(appDir) ? listSourceFiles(appDir) : []),
  ];
  const keyRe = /\bt\(\s*(['"`])([^'"`]+)\1/g;
  const useTRe = /useTranslation\(\s*(\[[^\]]*\]|'[^']*'|"[^"]*")?\s*\)/;

  const missing: string[] = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const useT = useTRe.exec(text);
    let namespaces: string[] = ['common'];
    if (useT?.[1]) namespaces = [...useT[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
    const defaultNs = namespaces[0];
    let m: RegExpExecArray | null;
    while ((m = keyRe.exec(text)) !== null) {
      const raw = m[2];
      if (!/[a-zA-Z]/.test(raw) || raw.includes(' ')) continue; // not a key (e.g. t('a b'))
      const [ns, key] = raw.includes(':') ? raw.split(':') : [defaultNs, raw];
      if (!(NAMESPACES as readonly string[]).includes(ns)) {
        missing.push(`${path.relative(root, file)}: unknown namespace in "${raw}"`);
        continue;
      }
      for (const locale of ['en', 'bn'] as const) {
        const set = keysOf(locale, ns);
        if (key.includes('${')) {
          const pattern = new RegExp(`^${key.replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\$\{[^}]*\}/g, '[^.]+')}$`);
          if (![...set].some((k) => pattern.test(k))) missing.push(`${locale}:${ns}:${key} (${path.relative(root, file)})`);
        } else if (!set.has(key)) {
          missing.push(`${locale}:${ns}:${key} (${path.relative(root, file)})`);
        }
      }
    }
  }

  it('finds every t("...") key in both languages', () => {
    expect(missing).toEqual([]);
  });

  it('covers the dynamic keys that are built from enums', () => {
    const profileEn = keysOf('en', 'profile');
    for (const theme of ['system', 'light', 'dark', 'colorful']) {
      expect(profileEn.has(`themes.${theme}.name`)).toBe(true);
      expect(profileEn.has(`themes.${theme}.hint`)).toBe(true);
    }
    for (const font of ['inter', 'poppins', 'roboto', 'nunito', 'opensans']) expect(profileEn.has(`fonts.${font}`)).toBe(true);
    for (const locale of ['en', 'bn']) expect(profileEn.has(`languages.${locale}`)).toBe(true);

    const projectsEn = keysOf('en', 'projects');
    for (const code of [
      'UNSUPPORTED_TYPE',
      'LEGACY_XLS',
      'FILE_TOO_LARGE',
      'EMPTY_FILE',
      'CORRUPT_FILE',
      'BAD_ENCODING',
      'UNSUPPORTED_WORKBOOK',
      'NO_VALID_ROWS',
      'READ_FAILED',
    ]) {
      expect(projectsEn.has(`import.errors.${code}`)).toBe(true);
    }
    const wheelEn = keysOf('en', 'wheel');
    for (const code of [
      'NOT_FOUND',
      'NOT_ACTIVE',
      'PROJECT_NOT_FOUND',
      'NO_PARTICIPANTS',
      'NO_ELIGIBLE',
      'DRAW_COMPLETE',
      'PENDING_REVEAL',
      'INVALID_WINNER_COUNT',
      'BELOW_DRAWN',
      'NOTHING_DRAWN',
      'UNKNOWN',
    ]) {
      expect(wheelEn.has(`errors.${code}`)).toBe(true);
    }
    const homeEn = keysOf('en', 'home');
    for (const part of ['morning', 'afternoon', 'evening']) expect(homeEn.has(`greeting.${part}`)).toBe(true);
  });
});

describe('initial language strategy', () => {
  it('prefers the saved language, then the device language, then English', () => {
    expect(pickInitialLocale('bn', 'en')).toBe('bn');
    expect(pickInitialLocale(null, 'bn')).toBe('bn');
    expect(pickInitialLocale(null, 'bn-BD')).toBe('bn');
    expect(pickInitialLocale(null, 'fr')).toBe('en');
    expect(pickInitialLocale('xx', null)).toBe('en');
    expect(pickInitialLocale(undefined, undefined)).toBe('en');
  });
});

describe('react-i18next instance binding', () => {
  it('has an initialized i18next instance registered with react-i18next without warnings', () => {
    const instance = getI18n();
    expect(instance).toBeDefined();
    expect(instance?.isInitialized).toBe(true);
    expect(instance?.t('appName', { ns: 'common' })).toBe('Pickzy');
  });

  it('renders components with useTranslation hook without NO_I18NEXT_INSTANCE warning', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let renderedText = '';
    function TestComponent() {
      const { t } = useTranslation('common');
      renderedText = t('appName');
      return null;
    }

    renderer.act(() => {
      renderer.create(React.createElement(TestComponent));
    });

    expect(renderedText).toBe('Pickzy');
    const warnings = warnSpy.mock.calls.flat().join(' ');
    expect(warnings).not.toContain('NO_I18NEXT_INSTANCE');
    warnSpy.mockRestore();
  });
});

