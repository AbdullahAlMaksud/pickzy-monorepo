import type { FontWeightName } from './tokens';

export type FontKey =
  | 'inter'
  | 'poppins'
  | 'roboto'
  | 'nunito'
  | 'opensans'
  | 'anekbangla'
  | 'notosansbengali';

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
  {
    key: 'anekbangla',
    label: 'Anek Bangla',
    prefix: 'AnekBangla',
    descriptionKey: 'profile:fonts.anekbangla',
  },
  {
    key: 'notosansbengali',
    label: 'Noto Sans Bengali',
    prefix: 'NotoSansBengali',
    descriptionKey: 'profile:fonts.notosansbengali',
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
export const BENGALI_DISPLAY_FONT_PREFIX = 'AnekBangla';

export type TextVariantRole = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'micro';

export interface ResolveFontInput {
  fontKey: FontKey;
  locale: string;
  weight: FontWeightName;
  /** When the text itself contains Bengali characters the Bengali family is always used. */
  text?: string | null;
  /** Variant role: display/title/heading use Anek Bangla; body/caption/label use Noto Sans Bengali. */
  variant?: TextVariantRole;
}

/**
 * Picks the bundled font family for a piece of text.
 *
 * For Bengali text (or Bengali UI), Anek Bangla is paired for headings/display titles,
 * and Noto Sans Bengali is paired for body text and micro/captions.
 * When the user selects a specific font key (like 'anekbangla' or 'notosansbengali'),
 * that choice is honored.
 */
export function resolveFontFamily({ fontKey, locale, weight, text, variant }: ResolveFontInput): string {
  const useBengali = locale === 'bn' || containsBengali(text);
  let prefix: string;

  if (useBengali) {
    if (fontKey === 'anekbangla') {
      prefix = 'AnekBangla';
    } else if (fontKey === 'notosansbengali') {
      prefix = 'NotoSansBengali';
    } else if (variant === 'display' || variant === 'title' || variant === 'heading') {
      prefix = BENGALI_DISPLAY_FONT_PREFIX;
    } else {
      prefix = BENGALI_FONT_PREFIX;
    }
  } else {
    prefix = FONT_OPTIONS.find((f) => f.key === fontKey)?.prefix ?? 'Inter';
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
