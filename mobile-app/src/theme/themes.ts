import {
  durations,
  fontSizes,
  fontWeights,
  lineHeightScale,
  makeShadows,
  radii,
  sizes,
  spacing,
  wheelPalette,
} from './tokens';

const shared = {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  lineHeightScale,
  sizes,
  durations,
  wheel: wheelPalette,
} as const;

export interface ColorTokens {
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primarySofter: string;
  onPrimary: string;
  secondary: string;
  secondarySoft: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  divider: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  overlay: string;
  inputBackground: string;
  winnerCard: string;
  winnerCardText: string;
  gold: string;
  /** The spin screen is a dark "stage" in every theme, as in the design reference. */
  stage: string;
  stageSurface: string;
  stageText: string;
  stageTextMuted: string;
  stageRing: string;
  switchTrackOff: string;
}

const lightColors: ColorTokens = {
  primary: '#17181C',
  primaryPressed: '#2C2D33',
  primarySoft: '#F0F1F5',
  primarySofter: '#F6F7FA',
  onPrimary: '#FFFFFF',
  secondary: '#3D3F47',
  secondarySoft: '#EAEBEF',
  background: '#F6F7F9',
  backgroundAlt: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F2F6',
  surfaceRaised: '#FFFFFF',
  border: '#E8EAEF',
  borderStrong: '#D2D5DF',
  divider: '#ECEEF2',
  text: '#121316',
  textSecondary: '#6C6E79',
  textMuted: '#9395A1',
  textInverse: '#FFFFFF',
  success: '#1F9D63',
  successSoft: '#DDF4E8',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  error: '#E5484D',
  errorSoft: '#FFE3E4',
  overlay: 'rgba(18, 19, 22, 0.6)',
  inputBackground: '#F1F2F6',
  winnerCard: '#F1F2F6',
  winnerCardText: '#121316',
  gold: '#F5A524',
  stage: '#F6F7F9',
  stageSurface: '#FFFFFF',
  stageText: '#121316',
  stageTextMuted: '#6C6E79',
  stageRing: '#2C2D33',
  switchTrackOff: '#D2D5DF',
};

const darkColors: ColorTokens = {
  primary: '#F0F1F5',
  primaryPressed: '#D2D5DF',
  primarySoft: '#24252B',
  primarySofter: '#1C1D22',
  onPrimary: '#121316',
  secondary: '#A0A2AE',
  secondarySoft: '#24252B',
  background: '#0E0F12',
  backgroundAlt: '#141519',
  surface: '#17181D',
  surfaceMuted: '#202127',
  surfaceRaised: '#23242B',
  border: '#2A2C34',
  borderStrong: '#3A3C46',
  divider: '#23242B',
  text: '#F4F5F8',
  textSecondary: '#A2A4B0',
  textMuted: '#727480',
  textInverse: '#121316',
  success: '#3FCB8B',
  successSoft: '#133A2A',
  warning: '#F5B13D',
  warningSoft: '#3A2D12',
  error: '#FF6B6F',
  errorSoft: '#43191D',
  overlay: 'rgba(5, 5, 8, 0.75)',
  inputBackground: '#202127',
  winnerCard: '#23242B',
  winnerCardText: '#F4F5F8',
  gold: '#F5B13D',
  stage: '#0E0F12',
  stageSurface: '#17181D',
  stageText: '#FFFFFF',
  stageTextMuted: '#8A8C98',
  stageRing: '#2A2C34',
  switchTrackOff: '#3A3C46',
};

const colorfulColors: ColorTokens = {
  primary: '#059669',
  primaryPressed: '#047857',
  primarySoft: '#D1FAE5',
  primarySofter: '#ECFDF5',
  onPrimary: '#FFFFFF',
  secondary: '#0D9488',
  secondarySoft: '#CCFBF1',
  background: '#F0FDF4',
  backgroundAlt: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#E6F7F0',
  surfaceRaised: '#FFFFFF',
  border: '#D1EFE2',
  borderStrong: '#A7E2C7',
  divider: '#E2F5EC',
  text: '#064E3B',
  textSecondary: '#166534',
  textMuted: '#4E7B6C',
  textInverse: '#FFFFFF',
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  error: '#E11D48',
  errorSoft: '#FFE4E6',
  overlay: 'rgba(6, 78, 59, 0.6)',
  inputBackground: '#E6F7F0',
  winnerCard: '#FEF3C7',
  winnerCardText: '#92400E',
  gold: '#F59E0B',
  stage: '#F0FDF4',
  stageSurface: '#FFFFFF',
  stageText: '#064E3B',
  stageTextMuted: '#166534',
  stageRing: '#059669',
  switchTrackOff: '#A7E2C7',
};

export const lightTheme = {
  ...shared,
  name: 'light' as const,
  isDark: false,
  colors: lightColors,
  shadows: makeShadows('#121316', 0.08),
};

export const darkTheme = {
  ...shared,
  name: 'dark' as const,
  isDark: true,
  colors: darkColors,
  shadows: makeShadows('#000000', 0.45),
};

export const colorfulTheme = {
  ...shared,
  name: 'colorful' as const,
  isDark: false,
  colors: colorfulColors,
  shadows: makeShadows('#065F46', 0.12),
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  colorful: colorfulTheme,
} as const;

export type ThemeName = keyof typeof themes;
export type AppTheme = (typeof themes)[ThemeName];
