import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';

/** Fixed marker at 12 o'clock; the tip points down into the wheel. It never rotates. */
function WheelPointerBase({ width = 34 }: { width?: number }) {
  const { theme } = useUnistyles();
  const height = width * 1.15;
  return (
    <Svg width={width} height={height} viewBox="0 0 34 39" accessibilityElementsHidden>
      <Path
        d="M17 38 L3 8 Q1.5 3.5 6.5 3 L27.5 3 Q32.5 3.5 31 8 Z"
        fill={theme.colors.error}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const WheelPointer = memo(WheelPointerBase);
