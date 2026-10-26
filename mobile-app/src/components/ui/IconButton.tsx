import { memo } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { haptic } from '@/utils/haptics';
import type { ColorTokens } from '@/theme/themes';
import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  icon: IconName;
  /** Required: icon-only buttons must have an accessible name. */
  label: string;
  onPress: () => void;
  color?: keyof ColorTokens | (string & {});
  size?: 'sm' | 'md' | 'lg';
  variant?: 'plain' | 'soft' | 'stage';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function IconButtonBase({
  icon,
  label,
  onPress,
  color = 'text',
  size = 'md',
  variant = 'plain',
  disabled = false,
  style,
  testID,
}: IconButtonProps) {
  styles.useVariants({ variant, disabled });
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

export const IconButton = memo(IconButtonBase);

const styles = StyleSheet.create((theme) => ({
  button: {
    width: theme.sizes.touch,
    height: theme.sizes.touch,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      variant: {
        plain: { backgroundColor: 'transparent' },
        soft: { backgroundColor: theme.colors.surfaceMuted },
        stage: { backgroundColor: theme.colors.stageSurface },
      },
      disabled: { true: { opacity: 0.4 }, false: {} },
    },
  },
  pressed: { opacity: 0.7 },
}));
