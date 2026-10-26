import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';

interface SettingRowProps {
  icon: IconName;
  title: string;
  description?: string;
  /** Right-side control (switch, stepper) or value text. */
  right?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  tone?: 'neutral' | 'danger';
  testID?: string;
}

/** Icon + title + description + trailing control. Shared by Draw Settings and Profile. */
function SettingRowBase({ icon, title, description, right, onPress, showChevron, tone = 'neutral', testID }: SettingRowProps) {
  styles.useVariants({ tone });
  const content = (
    <>
      <View style={styles.iconWrap}>
        <Icon name={icon} size="md" color={tone === 'danger' ? 'error' : 'primary'} />
      </View>
      <View style={styles.text}>
        <AppText variant="label" weight="semibold" tone={tone === 'danger' ? 'error' : 'text'}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      {right}
      {showChevron ? <Icon name="chevron-right" size="sm" color="textMuted" /> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={styles.row}>
      {content}
    </View>
  );
}

export const SettingRow = memo(SettingRowBase);

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 64,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  pressed: { backgroundColor: theme.colors.surfaceMuted },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      tone: {
        neutral: { backgroundColor: theme.colors.primarySoft },
        danger: { backgroundColor: theme.colors.errorSoft },
      },
    },
  },
  text: { flex: 1, gap: 2 },
}));
