import { memo } from 'react';
import { Path } from 'react-native-svg';
import { segmentAngle, segmentPath } from '../services/wheelGeometry';

interface WheelSegmentProps {
  index: number;
  count: number;
  cx: number;
  cy: number;
  radius: number;
  color: string;
  separator: string;
}

/** One pie slice. Pure vector path: no per-frame work, the whole wheel rotates as one layer. */
function WheelSegmentBase({ index, count, cx, cy, radius, color, separator }: WheelSegmentProps) {
  const seg = segmentAngle(count);
  const d = segmentPath(cx, cy, radius, index * seg, (index + 1) * seg);
  return <Path d={d} fill={color} stroke={separator} strokeWidth={count > 1 ? 1.5 : 0} strokeLinejoin="round" />;
}

export const WheelSegment = memo(WheelSegmentBase);
