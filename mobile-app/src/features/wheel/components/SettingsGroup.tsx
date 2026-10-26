import { Children, type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui/AppText';

export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <View style={styles.wrapper}>
      {title ? (
        <AppText variant="label" weight="semibold" tone="secondary" accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
      ) : null}
      <View style={styles.group}>
        {items.map((child, i) => (
          <View key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: { gap: theme.spacing.sm },
  title: { marginStart: theme.spacing.xs },
  group: { borderRadius: theme.radii.lg, overflow: 'hidden', backgroundColor: theme.colors.surface, ...theme.shadows.sm },
  divider: { height: 1, backgroundColor: theme.colors.divider, marginStart: 72 },
}));
