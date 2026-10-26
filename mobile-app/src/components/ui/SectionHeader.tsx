import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
}

function SectionHeaderBase({ title, actionLabel, onAction, right }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="heading" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {right}
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} hitSlop={10} style={styles.action}>
          <AppText variant="label" tone="primary" weight="semibold">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export const SectionHeader = memo(SectionHeaderBase);

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  title: { flex: 1 },
  action: { minHeight: theme.sizes.touch, justifyContent: 'center' },
}));
