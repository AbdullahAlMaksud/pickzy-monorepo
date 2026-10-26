import { memo } from 'react';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui/AppText';
import { haptic } from '@/utils/haptics';

interface WheelCenterButtonProps {
  size: number;
  label: string;
  disabled: boolean;
  onPress: () => void;
  accessibilityHint?: string;
}

/** Brand-styled hub with the Spin action, drawn above the rotating wheel. */
function WheelCenterButtonBase({ size, label, disabled, onPress, accessibilityHint }: WheelCenterButtonProps) {
  styles.useVariants({ disabled });
  return (
    <Pressable
      testID="spin-center-button"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptic.medium();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="heading" weight="bold" style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </AppText>
    </Pressable>
  );
}

export const WheelCenterButton = memo(WheelCenterButtonBase);

const styles = StyleSheet.create((theme) => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 5,
    borderColor: theme.colors.stageRing,
    ...theme.shadows.lg,
    variants: { disabled: { true: { opacity: 0.9 }, false: {} } },
  },
  pressed: { transform: [{ scale: 0.96 }] },
  label: { color: '#16162E', paddingHorizontal: 6 },
}));
