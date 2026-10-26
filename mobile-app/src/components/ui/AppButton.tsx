import { memo } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { haptic } from '@/utils/haptics';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  compact?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

function AppButtonBase({
  label,
  onPress,
  variant = 'primary',
  compact = false,
  loading = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = true,
  style,
  accessibilityHint,
  testID,
}: AppButtonProps) {
  const { theme } = useUnistyles();
  const inactive = disabled || loading;
  styles.useVariants({ variant, compact, disabled: inactive, fullWidth });
  const fg =
    variant === 'primary' || variant === 'destructive'
      ? theme.colors.onPrimary
      : variant === 'secondary' || variant === 'outline' || variant === 'ghost'
        ? theme.colors.primary
        : theme.colors.text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [styles.button, pressed && !inactive && styles.pressed, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size="sm" color={fg} /> : null}
          <AppText
            variant="label"
            weight="semibold"
            style={{ color: fg }}
            numberOfLines={2}
            align="center"
          >
            {label}
          </AppText>
          {iconRight ? <Icon name={iconRight} size="sm" color={fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

export const AppButton = memo(AppButtonBase);

const styles = StyleSheet.create((theme) => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    variants: {
      variant: {
        primary: { backgroundColor: theme.colors.primary, ...theme.shadows.sm },
        secondary: { backgroundColor: theme.colors.primarySoft },
        outline: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        },
        destructive: { backgroundColor: theme.colors.error },
        ghost: { backgroundColor: 'transparent' },
      },
      compact: {
        true: { minHeight: theme.sizes.button.compact, paddingHorizontal: theme.spacing.md },
        false: { minHeight: theme.sizes.button.regular },
      },
      disabled: { true: { opacity: 0.5 }, false: {} },
      fullWidth: { true: { alignSelf: 'stretch' }, false: { alignSelf: 'flex-start' } },
    },
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
}));
