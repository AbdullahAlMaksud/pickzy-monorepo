import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Avatar } from '@/components/ui/Avatar';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';

interface WinnerCardProps {
  name: string;
  /** Text label for the position, e.g. "Winner 1". Never rely on color alone. */
  positionLabel: string;
  colorIndex: number;
  testID?: string;
}

/** A winner row (crown icon + text label, so it is not conveyed by color only). */
function WinnerCardBase({ name, positionLabel, colorIndex, testID }: WinnerCardProps) {
  return (
    <View style={styles.card} testID={testID} accessible accessibilityLabel={`${positionLabel}: ${name}`}>
      <Avatar name={name} size={40} colorIndex={colorIndex} />
      <View style={styles.text}>
        <AppText variant="caption" tone="stageMuted">
          {positionLabel}
        </AppText>
        <AppText variant="label" weight="semibold" tone="stage" numberOfLines={1}>
          {name}
        </AppText>
      </View>
      <Icon name="crown" size="sm" color="gold" />
    </View>
  );
}

export const WinnerCard = memo(WinnerCardBase);

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.stageSurface,
  },
  text: { flex: 1 },
}));
