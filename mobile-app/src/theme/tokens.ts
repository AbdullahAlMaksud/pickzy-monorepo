/**
 * Design tokens shared by every theme.
 * Colors live in `themes.ts` (they differ per theme); everything else is here so that
 * screens never contain magic numbers.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const fontSizes = {
  display: 30,
  title: 22,
  heading: 17,
  body: 15,
  label: 14,
  caption: 12.5,
  micro: 11,
} as const;

export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold';

export const fontWeights: Record<FontWeightName, '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/** Line-height multiplier. Bengali needs more vertical room for matras and conjuncts. */
export const lineHeightScale = { latin: 1.4, bengali: 1.62 } as const;

export const sizes = {
  /** Minimum comfortable touch target (pt). */
  touch: 44,
  icon: { xs: 14, sm: 18, md: 22, lg: 26, xl: 32 },
  avatar: { xs: 28, sm: 36, md: 44, lg: 56, xl: 104 },
  button: { compact: 38, regular: 52 },
  input: 50,
  tabBar: 64,
  headerHeight: 56,
  wheelMax: 380,
} as const;

export const durations = {
  fast: 140,
  base: 240,
  slow: 420,
  spin: 5600,
  spinReduced: 900,
  confetti: 2600,
  toast: 2600,
} as const;

export const breakpoints = {
  xs: 0,
  sm: 360,
  md: 420,
  lg: 600,
  xl: 840,
} as const;

/** Wheel segment palette: vivid enough to read on the dark stage, soft enough for light UI. */
export const wheelPalette = [
  '#8B6CF6', // violet
  '#F7B93E', // amber
  '#3FCB8B', // green
  '#F2557A', // rose
  '#3C9DFF', // blue
  '#FF8D5C', // orange
  '#2FBFC0', // teal
  '#C264E6', // orchid
] as const;

/** Pastel avatar colors (background, foreground pairs). */
export const avatarPalette = [
  { bg: '#E3DEFF', fg: '#4C43C4' },
  { bg: '#D6F3E4', fg: '#18794E' },
  { bg: '#FFE6CC', fg: '#B35A00' },
  { bg: '#FFD9E3', fg: '#B3224D' },
  { bg: '#D4E9FF', fg: '#1A5FB4' },
  { bg: '#F6DCFA', fg: '#8E2AA8' },
  { bg: '#CFF1F1', fg: '#127C7E' },
  { bg: '#FFF1BF', fg: '#8A6500' },
] as const;

/** Solid avatar colors used in lists (white initial on color), as in the reference design. */
export const avatarSolid = [
  '#3FB67D',
  '#4F6CF0',
  '#E5484D',
  '#B04FD0',
  '#F5A524',
  '#2FA9B8',
  '#6C5CE7',
  '#E8743B',
] as const;

export function makeShadows(color: string, strength: number) {
  return {
    none: {
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    sm: {
      shadowColor: color,
      shadowOpacity: strength * 0.7,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    md: {
      shadowColor: color,
      shadowOpacity: strength,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    lg: {
      shadowColor: color,
      shadowOpacity: strength * 1.4,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  } as const;
}
