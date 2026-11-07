import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { haptic } from '@/utils/haptics';

interface Props {
  icon: IconName;
  title: string;
  subtitle: string;
  variant: 'primary' | 'soft';
  onPress: () => void;
  testID?: string;
}

/** The big tappable cards on Home ("Create New Project", "My Projects"). */
function ActionCardBase({ icon, title, subtitle, variant, onPress, testID }: Props) {
  styles.useVariants({ variant });
  const primary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon name={icon} size="lg" color={primary ? 'onPrimary' : 'text'} />
      </View>
      <View style={styles.text}>
        <AppText variant="heading" weight="bold" tone={primary ? 'onPrimary' : 'text'}>
          {title}
        </AppText>
        <AppText
          variant="caption"
          tone={primary ? 'onPrimary' : 'secondary'}
          style={primary ? styles.subtitleOnPrimary : styles.subtitle}
        >
          {subtitle}
        </AppText>
      </View>
      <Icon name="arrow-right" size="sm" color={primary ? 'onPrimary' : 'text'} />
    </Pressable>
  );
}

export const ActionCard = memo(ActionCardBase);

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    variants: {
      variant: {
        primary: {
          backgroundColor: theme.colors.primary,
          ...theme.shadows.md,
        },
        soft: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.sm,
        },
      },
    },
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      variant: {
        primary: { backgroundColor: 'rgba(255,255,255,0.18)' },
        soft: { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md },
      },
    },
  },
  text: { flex: 1, gap: 3 },
  subtitleOnPrimary: { opacity: 0.75 },
  subtitle: { color: theme.colors.textSecondary },
}));
