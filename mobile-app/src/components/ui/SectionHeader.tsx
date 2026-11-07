import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
}

function SectionHeaderBase({ title, actionLabel, onAction, right }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="heading" weight="bold" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {right}
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={10}
          style={styles.action}
        >
          <AppText variant="label" tone="text" weight="semibold">
            {actionLabel}
          </AppText>
          <Icon name="arrow-right" size="xs" color="text" />
        </Pressable>
      ) : null}
    </View>
  );
}

export const SectionHeader = memo(SectionHeaderBase);

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
  },
  action: {
    minHeight: theme.sizes.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
}));
