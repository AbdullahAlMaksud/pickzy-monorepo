import { UnistylesRuntime } from 'react-native-unistyles';
import type { ThemePreference } from '@/features/profile/types';

/**
 * `system` follows the device light/dark setting (Unistyles adaptive themes).
 * Any other value pins the theme explicitly.
 */
export function applyThemePreference(preference: ThemePreference): void {
  if (preference === 'system') {
    UnistylesRuntime.setAdaptiveThemes(true);
    return;
  }
  UnistylesRuntime.setAdaptiveThemes(false);
  UnistylesRuntime.setTheme(preference);
}
