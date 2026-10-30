import { describe, expect, it } from 'vitest';
import { resources } from '@/i18n';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    if (typeof value === 'string') all[`${prefix}${key}`] = value;
    else Object.assign(all, flatten(value, `${prefix}${key}.`));
    return all;
  }, {});
}

/** `{{count, localeNumber}}` → `count`. Translations may differ in words, never in placeholders. */
const placeholders = (text: string) => [...text.matchAll(/{{\s*(\w+)/g)].map((m) => m[1]).sort();
/** Plural keys differ per language (`_one`/`_other`), so compare the base key. */
const baseKey = (key: string) => key.replace(/_(zero|one|two|few|many|other)$/, '');

describe('translations', () => {
  const namespaces = Object.keys(resources.en) as (keyof typeof resources.en)[];

  it.each(namespaces)('%s has the same keys in English and Bengali', (ns) => {
    const en = new Set(Object.keys(flatten(resources.en[ns] as Tree)).map(baseKey));
    const bn = new Set(Object.keys(flatten(resources.bn[ns] as Tree)).map(baseKey));
    expect([...en].filter((k) => !bn.has(k))).toEqual([]);
    expect([...bn].filter((k) => !en.has(k))).toEqual([]);
  });

  it.each(namespaces)('%s uses the same placeholders in both languages', (ns) => {
    const en = flatten(resources.en[ns] as Tree);
    const bn = flatten(resources.bn[ns] as Tree);
    const mismatched = Object.keys(en)
      .filter((key) => key in bn)
      .filter((key) => placeholders(en[key]).join() !== placeholders(bn[key]).join());
    expect(mismatched).toEqual([]);
  });

  it('has no empty strings', () => {
    for (const lang of ['en', 'bn'] as const) {
      for (const ns of namespaces) {
        const empty = Object.entries(flatten(resources[lang][ns] as Tree)).filter(([, v]) => v.trim() === '');
        expect(empty).toEqual([]);
      }
    }
  });
});
