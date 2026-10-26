import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { durations } from '@/theme/tokens';
import { useToastStore } from '@/store/toastStore';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';

/** Mount once at the root. Shows one message at a time and dismisses itself. */
export function ToastHost() {
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => dismiss(current.id), durations.toast);
    return () => clearTimeout(id);
  }, [current, dismiss]);

  if (!current) return null;
  styles.useVariants({ tone: current.tone });
  return (
    <View style={styles.host} pointerEvents="none">
      <Animated.View
        key={current.id}
        entering={FadeInDown.duration(180)}
        exiting={FadeOutDown.duration(140)}
        style={styles.toast}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        <Icon
          name={current.tone === 'success' ? 'circle-check' : current.tone === 'error' ? 'triangle-alert' : 'info'}
          size="sm"
          color="#FFFFFF"
        />
        <AppText variant="label" style={styles.text}>
          {current.message}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  host: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: rt.insets.bottom + theme.sizes.tabBar + theme.spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    maxWidth: 520,
    ...theme.shadows.md,
    variants: {
      tone: {
        success: { backgroundColor: '#1B7F57' },
        info: { backgroundColor: '#2C2C52' },
        error: { backgroundColor: '#C0343A' },
      },
    },
  },
  text: { color: '#FFFFFF', flexShrink: 1 },
}));
