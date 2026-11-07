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
        <Icon name={icon} size="md" color="text" />
      </View>
      <AppText variant="title" weight="bold" tone="text" style={styles.value}>
        {value}
      </AppText>
      <AppText variant="caption" tone="secondary" numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

export const StatCard = memo(StatCardBase);

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  icon: {
    width: 28,
    height: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: 22,
    lineHeight: 28,
  },
  label: {
    fontSize: 12,
    marginTop: 1,
  },
}));
