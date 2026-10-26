import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';

interface Props {
  icon: IconName;
  value: string;
  label: string;
  testID?: string;
}

function StatCardBase({ icon, value, label, testID }: Props) {
  return (
    <View style={styles.card} testID={testID} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.icon}>
        <Icon name={icon} size="sm" color="primary" />
      </View>
      <AppText variant="title" weight="bold">
        {value}
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export const StatCard = memo(StatCardBase);

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    gap: 2,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.primarySoft,
  },
}));
