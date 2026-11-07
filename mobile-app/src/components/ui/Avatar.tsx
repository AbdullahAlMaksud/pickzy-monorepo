import { memo } from 'react';
import { Image, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { avatarSolid } from '@/theme/tokens';
import { initialOf } from '@/features/participants/services/participantNormalization';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface AvatarProps {
  name?: string;
  photoUri?: string | null;
  size?: number;
  /** Stable index (e.g. list position) used to pick a color. */
  colorIndex?: number;
  shape?: 'circle' | 'squircle';
  showBorder?: boolean;
  testID?: string;
}

function AvatarBase({
  name = '',
  photoUri,
  size = 40,
  colorIndex = 0,
  shape = 'circle',
  showBorder = false,
  testID,
}: AvatarProps) {
  const radius = shape === 'squircle' ? Math.round(size * 0.32) : size / 2;
  const borderStyle = showBorder ? { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' } : undefined;

  if (photoUri) {
    return (
      <Image
        testID={testID}
        source={{ uri: photoUri }}
        style={[{ width: size, height: size, borderRadius: radius }, borderStyle]}
        accessibilityIgnoresInvertColors
      />
    );
  }
  const color = avatarSolid[Math.abs(colorIndex) % avatarSolid.length];
  return (
    <View
      testID={testID}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: name ? color : undefined,
        },
        borderStyle,
      ]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {name ? (
        <AppText weight="bold" tone="onPrimary" style={{ fontSize: size * 0.42, lineHeight: size * 0.6 }}>
          {initialOf(name)}
        </AppText>
      ) : (
        <Icon name="user" size="md" color="primary" />
      )}
    </View>
  );
}

export const Avatar = memo(AvatarBase);

const styles = StyleSheet.create((theme) => ({
  circle: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft },
}));
