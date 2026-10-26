import { StyleSheet } from 'react-native-unistyles';
import { themes } from './themes';
import { breakpoints } from './tokens';

type AppThemes = typeof themes;
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

/**
 * Must be imported before any component that calls `StyleSheet.create`
 * (see `/index.ts`). Themes are switched at runtime with `UnistylesRuntime`.
 */
StyleSheet.configure({
  themes,
  breakpoints,
  settings: {
    adaptiveThemes: true,
  },
});
