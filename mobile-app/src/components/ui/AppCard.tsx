import { memo, type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  tone?: 'surface' | 'soft' | 'muted';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function AppCardBase({
  children,
  onPress,
  accessibilityLabel,
  tone = 'surface',
  padded = true,
  style,
  testID,
}: AppCardProps) {
  styles.useVariants({ tone, padded });
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

export const AppCard = memo(AppCardBase);

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radii.lg,
    variants: {
      tone: {
        surface: { backgroundColor: theme.colors.surface, ...theme.shadows.sm },
        soft: { backgroundColor: theme.colors.primarySoft },
        muted: { backgroundColor: theme.colors.surfaceMuted },
      },
      padded: { true: { padding: theme.spacing.lg }, false: {} },
    },
  },
  pressed: { opacity: 0.85 },
}));
