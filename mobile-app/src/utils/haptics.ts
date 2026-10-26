import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/appStore';

const enabled = () => useAppStore.getState().preferences.haptics;

/** All haptics go through here so the user's preference is always respected. Failures are ignored. */
export const haptic = {
  light: () => {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  medium: () => {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  },
  heavy: () => {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
  },
  selection: () => {
    if (enabled()) void Haptics.selectionAsync().catch(() => undefined);
  },
  success: () => {
    if (enabled()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  },
  warning: () => {
    if (enabled()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
  },
};
