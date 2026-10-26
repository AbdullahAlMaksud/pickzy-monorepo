import { memo } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const LOGO_SOURCE = require('../../../assets/icon/icon-big.png');

interface AppLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

function AppLogoBase({ size = 36, style, testID = 'app-logo' }: AppLogoProps) {
  return (
    <Image
      source={LOGO_SOURCE}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Pickzy logo"
      testID={testID}
    />
  );
}

export const AppLogo = memo(AppLogoBase);
