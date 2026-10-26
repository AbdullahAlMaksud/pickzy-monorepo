import {
  breakpoints,
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
  primary: '#635BDF',
  primaryPressed: '#524AC8',
  primarySoft: '#ECEAFF',
  primarySofter: '#F4F3FF',
  onPrimary: '#FFFFFF',
  secondary: '#F5A524',
  secondarySoft: '#FFF3DB',
  background: '#F7F6FF',
  backgroundAlt: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F3FA',
  surfaceRaised: '#FFFFFF',
  border: '#E6E5F2',
  borderStrong: '#CFCDE6',
  divider: '#EEEDF7',
  text: '#16162E',
  textSecondary: '#5B5B78',
  textMuted: '#8E8EA8',
  textInverse: '#FFFFFF',
  success: '#1F9D63',
  successSoft: '#DDF4E8',
  warning: '#B77400',
  warningSoft: '#FFF0D1',
  error: '#E5484D',
  errorSoft: '#FFE3E4',
  overlay: 'rgba(17, 17, 40, 0.55)',
  inputBackground: '#F3F3FA',
  winnerCard: '#FFF1DC',
  winnerCardText: '#B26A00',
  gold: '#F5A524',
  stage: '#171733',
  stageSurface: '#25254A',
  stageText: '#FFFFFF',
  stageTextMuted: '#A9A9CC',
  stageRing: '#2E2E5C',
  switchTrackOff: '#D8D7EA',
};

const darkColors: ColorTokens = {
  primary: '#7C74F0',
  primaryPressed: '#6A62E0',
  primarySoft: '#2B2859',
  primarySofter: '#211F45',
  onPrimary: '#FFFFFF',
  secondary: '#F5B13D',
  secondarySoft: '#3A2D12',
  background: '#101024',
  backgroundAlt: '#16162E',
  surface: '#1B1B38',
  surfaceMuted: '#23234A',
  surfaceRaised: '#24244A',
  border: '#2E2E58',
  borderStrong: '#42427A',
  divider: '#272750',
  text: '#F3F3FF',
  textSecondary: '#B9B9D6',
  textMuted: '#8585AB',
  textInverse: '#16162E',
  success: '#3FCB8B',
  successSoft: '#133A2A',
  warning: '#F5B13D',
  warningSoft: '#3A2D12',
  error: '#FF6B6F',
  errorSoft: '#43191D',
  overlay: 'rgba(5, 5, 18, 0.7)',
  inputBackground: '#23234A',
  winnerCard: '#3A2D12',
  winnerCardText: '#FFC76A',
  gold: '#F5B13D',
  stage: '#0C0C1F',
  stageSurface: '#1D1D3F',
  stageText: '#FFFFFF',
  stageTextMuted: '#9A9AC2',
  stageRing: '#26264F',
  switchTrackOff: '#3A3A66',
};

const colorfulColors: ColorTokens = {
  primary: '#D6336C',
  primaryPressed: '#BE2A5E',
  primarySoft: '#FFE3EE',
  primarySofter: '#FFF0F6',
  onPrimary: '#FFFFFF',
  secondary: '#2F9BFF',
  secondarySoft: '#DCEEFF',
  background: '#FFF6FA',
  backgroundAlt: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#FFEEF5',
  surfaceRaised: '#FFFFFF',
  border: '#FBD6E6',
  borderStrong: '#F3B4CF',
  divider: '#FDE4EF',
  text: '#2A1030',
  textSecondary: '#6E4A72',
  textMuted: '#A07FA4',
  textInverse: '#FFFFFF',
  success: '#12A06A',
  successSoft: '#D9F6E9',
  warning: '#B86E00',
  warningSoft: '#FFEFD0',
  error: '#E03131',
  errorSoft: '#FFE1E1',
  overlay: 'rgba(42, 16, 48, 0.55)',
  inputBackground: '#FFEEF5',
  winnerCard: '#FFF0D6',
  winnerCardText: '#B26A00',
  gold: '#F59F00',
  stage: '#2A1245',
  stageSurface: '#3B1D5E',
  stageText: '#FFFFFF',
  stageTextMuted: '#CDB2E8',
  stageRing: '#4A2775',
  switchTrackOff: '#F3C3D9',
};

export const lightTheme = {
  ...shared,
  name: 'light' as const,
  isDark: false,
  colors: lightColors,
  shadows: makeShadows('#2B2780', 0.1),
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
  shadows: makeShadows('#8E1F55', 0.12),
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  colorful: colorfulTheme,
} as const;


export type ThemeName = keyof typeof themes;
export type AppTheme = (typeof themes)[ThemeName];
