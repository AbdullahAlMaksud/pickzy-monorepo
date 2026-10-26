import type { FontWeightName } from './tokens';

export type FontKey = 'inter' | 'poppins' | 'roboto' | 'nunito' | 'opensans';

export interface FontOption {
  key: FontKey;
  /** Display name (proper nouns are not translated). */
  label: string;
  /** Prefix of the bundled TTF family names, e.g. `Inter` -> `Inter_400Regular`. */
  prefix: string;
  descriptionKey: string;
}

export const FONT_OPTIONS: readonly FontOption[] = [
  { key: 'inter', label: 'Inter', prefix: 'Inter', descriptionKey: 'profile:fonts.inter' },
  { key: 'poppins', label: 'Poppins', prefix: 'Poppins', descriptionKey: 'profile:fonts.poppins' },
  { key: 'roboto', label: 'Roboto', prefix: 'Roboto', descriptionKey: 'profile:fonts.roboto' },
  { key: 'nunito', label: 'Nunito', prefix: 'Nunito', descriptionKey: 'profile:fonts.nunito' },
  {
    key: 'opensans',
    label: 'Open Sans',
    prefix: 'OpenSans',
    descriptionKey: 'profile:fonts.opensans',
  },
] as const;

export const DEFAULT_FONT_KEY: FontKey = 'inter';

export const FONT_KEYS: readonly FontKey[] = FONT_OPTIONS.map((f) => f.key);

export function isFontKey(value: unknown): value is FontKey {
  return typeof value === 'string' && (FONT_KEYS as readonly string[]).includes(value);
}

const WEIGHT_SUFFIX: Record<FontWeightName, string> = {
  regular: '400Regular',
  medium: '500Medium',
  semibold: '600SemiBold',
  bold: '700Bold',
};

/** Bengali Unicode block (U+0980 - U+09FF). */
const BENGALI_RE = /[ঀ-৿]/;

export function containsBengali(text: string | undefined | null): boolean {
  return !!text && BENGALI_RE.test(text);
}

export const BENGALI_FONT_PREFIX = 'NotoSansBengali';

export interface ResolveFontInput {
  fontKey: FontKey;
  locale: string;
  weight: FontWeightName;
  /** When the text itself contains Bengali characters the Bengali family is always used. */
  text?: string | null;
}

/**
 * Picks the bundled font family for a piece of text.
 *
 * Latin fonts such as Inter or Poppins have no Bengali glyphs, so whenever the UI language is
 * Bengali (or the text itself contains Bengali characters, e.g. imported participant names in an
 * English UI) we use Noto Sans Bengali, which also contains Latin glyphs.
 */
export function resolveFontFamily({ fontKey, locale, weight, text }: ResolveFontInput): string {
  const useBengali = locale === 'bn' || containsBengali(text);
  const prefix = useBengali
    ? BENGALI_FONT_PREFIX
    : (FONT_OPTIONS.find((f) => f.key === fontKey)?.prefix ?? 'Inter');
  return `${prefix}_${WEIGHT_SUFFIX[weight]}`;
}

export const FONT_WEIGHT_NAMES: readonly FontWeightName[] = [
  'regular',
  'medium',
  'semibold',
  'bold',
];

export function familyNamesFor(prefix: string): string[] {
  return FONT_WEIGHT_NAMES.map((w) => `${prefix}_${WEIGHT_SUFFIX[w]}`);
}
