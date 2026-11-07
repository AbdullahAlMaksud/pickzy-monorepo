import type { FontWeightName } from './tokens';

export type FontKey =
  | 'playfair'
  | 'opensans'
  | 'anekbangla'
  | 'purno';

export interface FontOption {
  key: FontKey;
  /** Display name (proper nouns are not translated). */
  label: string;
  /** Prefix of the bundled TTF family names, e.g. `OpenSans` -> `OpenSans_400Regular`. */
  prefix: string;
  descriptionKey: string;
}

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    key: 'playfair',
    label: 'Playfair Display',
    prefix: 'PlayfairDisplay',
    descriptionKey: 'profile:fonts.playfair',
  },
  {
    key: 'opensans',
    label: 'Open Sans',
    prefix: 'OpenSans',
    descriptionKey: 'profile:fonts.opensans',
  },
  {
    key: 'anekbangla',
    label: 'Anek Bangla',
    prefix: 'AnekBangla',
    descriptionKey: 'profile:fonts.anekbangla',
  },
  {
    key: 'purno',
    label: 'Purno',
    prefix: 'Purno',
    descriptionKey: 'profile:fonts.purno',
  },
] as const;

export const DEFAULT_FONT_KEY: FontKey = 'opensans';

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

export const BENGALI_FONT_PREFIX = 'AnekBangla';
export const BENGALI_DISPLAY_FONT_PREFIX = 'AnekBangla';

export type TextVariantRole = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'micro';

export interface ResolveFontInput {
  fontKey: FontKey;
  locale: string;
  weight: FontWeightName;
  /** When the text itself contains Bengali characters the Bengali family is always used. */
  text?: string | null;
  /** Variant role: display/title/heading use Anek Bangla; body/caption/label use Anek Bangla/Purno. */
  variant?: TextVariantRole;
}

/**
 * Picks the bundled font family for a piece of text.
 *
 * For Bengali text (or Bengali UI), Anek Bangla or Purno is used.
 * When the user selects a specific font key (like 'anekbangla' or 'purno'),
 * that choice is honored.
 */
export function resolveFontFamily({ fontKey, locale, weight, text, variant }: ResolveFontInput): string {
  const useBengali = locale === 'bn' || containsBengali(text);
  let prefix: string;

  if (useBengali) {
    if (fontKey === 'purno') {
      prefix = 'Purno';
    } else if (fontKey === 'anekbangla') {
      prefix = 'AnekBangla';
    } else if (variant === 'display' || variant === 'title' || variant === 'heading') {
      prefix = BENGALI_DISPLAY_FONT_PREFIX;
    } else {
      prefix = BENGALI_FONT_PREFIX;
    }
  } else {
    prefix = FONT_OPTIONS.find((f) => f.key === fontKey)?.prefix ?? 'OpenSans';
  }

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
