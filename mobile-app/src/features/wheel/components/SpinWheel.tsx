import { forwardRef, memo, useCallback, useImperativeHandle, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { readableTextColor } from '@/utils/color';
import { haptic } from '@/utils/haptics';
import type { DrawParticipant } from '../types';
import {
  computeLabelLayout,
  normalizeDegrees,
  segmentAngle,
  segmentCenterAngle,
  truncateLabel,
} from '../services/wheelGeometry';
import { segmentColorIndex } from '../services/wheelColors';
import { WheelCenterButton } from './WheelCenterButton';
import { WheelPointer } from './WheelPointer';
import { WheelSegment } from './WheelSegment';

export interface SpinWheelHandle {
  /** Animate to an absolute rotation (degrees). Calls `onFinished` exactly once when it ends. */
  spinTo(targetRotation: number, durationMs: number, onFinished: () => void): void;
  /** Jump to a rotation without animating (restoring a saved result). */
  jumpTo(rotation: number): void;
  /** Stop immediately at the final rotation (app returned from background mid-spin). */
  finishNow(targetRotation: number): void;
  getRotation(): number;
}

interface SpinWheelProps {
  items: readonly DrawParticipant[];
  size: number;
  spinLabel: string;
  spinHint?: string;
  spinDisabled: boolean;
  onSpinPress: () => void;
}

// Slight ease-in, long ease-out: the wheel lurches into motion and coasts to a stop.
const SPIN_EASING = Easing.bezier(0.17, 0.67, 0.12, 0.99);
const MAX_TICK_SEGMENTS = 60;

function SpinWheelBase(
  { items, size, spinLabel, spinHint, spinDisabled, onSpinPress }: SpinWheelProps,
  ref: React.Ref<SpinWheelHandle>,
) {
  const { theme } = useUnistyles();
  const { t, i18n } = useTranslation('wheel');
  const rotation = useSharedValue(0);
  const lastTick = useSharedValue(0);
  const count = items.length;
  const radius = size / 2;
  const rimWidth = Math.max(10, size * 0.045);
  const discRadius = radius - rimWidth;
  const hubSize = size * 0.27;
  const locale = i18n.language?.startsWith('bn') ? 'bn' : 'en';

  const finishedCallback = useCallback((cb: () => void) => cb(), []);
  // A plain JS-thread function captured by the worklet below (not `haptic.selection` via the module object).
  const tick = useCallback(() => haptic.selection(), []);

  useImperativeHandle(
    ref,
    () => ({
      spinTo(targetRotation, durationMs, onFinished) {
        cancelAnimation(rotation);
        rotation.value = withTiming(targetRotation, { duration: durationMs, easing: SPIN_EASING }, (finished) => {
          if (finished) scheduleOnRN(finishedCallback, onFinished);
        });
      },
      jumpTo(value) {
        cancelAnimation(rotation);
        rotation.value = value;
      },
      finishNow(targetRotation) {
        cancelAnimation(rotation);
        rotation.value = targetRotation;
      },
      getRotation: () => rotation.value,
    }),
    [rotation, finishedCallback],
  );

  // Light haptic "tick" whenever a segment passes the pointer (throttled, UI-thread detection).
  const tickCount = count <= MAX_TICK_SEGMENTS ? count : 0;
  useAnimatedReaction(
    () => (tickCount > 0 ? Math.floor(normalizeDegrees(-rotation.value) / (360 / tickCount)) : -1),
    (current, previous) => {
      if (tickCount === 0 || previous === null || current === previous) return;
      const now = Date.now();
      if (now - lastTick.value < 110) return;
      lastTick.value = now;
      scheduleOnRN(tick);
    },
    [tickCount, tick],
  );

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const colors = theme.wheel;
  const labelLayout = useMemo(() => computeLabelLayout(count, discRadius), [count, discRadius]);

  // The static wheel artwork only re-renders when the items or size change: never per frame.
  const artwork = useMemo(
    () => (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={radius} cy={radius} r={radius - rimWidth / 2} fill={theme.colors.stageRing} />
        {Array.from({ length: 24 }, (_, i) => {
          const a = ((i * 15 - 90) * Math.PI) / 180;
          const rr = radius - rimWidth / 2;
          return (
            <Circle
              key={i}
              cx={radius + rr * Math.cos(a)}
              cy={radius + rr * Math.sin(a)}
              r={Math.max(1.6, rimWidth * 0.14)}
              fill={i % 2 === 0 ? '#FFFFFF' : theme.colors.stageTextMuted}
              opacity={0.85}
            />
          );
        })}
        <G>
          {items.map((item, i) => (
            <WheelSegment
              key={item.id}
              index={i}
              count={count}
              cx={radius}
              cy={radius}
              radius={discRadius}
              color={colors[segmentColorIndex(i, count, colors.length)]}
              separator={theme.colors.stage}
            />
          ))}
        </G>
      </Svg>
    ),
    [items, count, size, radius, rimWidth, discRadius, colors, theme.colors.stage, theme.colors.stageRing, theme.colors.stageTextMuted],
  );

  // Labels are plain RN <Text> rotated about the wheel center, so they use the same font pipeline
  // (including Bengali shaping and fallback) as the rest of the app.
  const labels = useMemo(() => {
    if (!labelLayout.visible || count === 0) return null;
    const hubEdge = hubSize / 2;
    const lineHeight = Math.ceil(labelLayout.fontSize * (locale === 'bn' ? 1.7 : 1.35));
    return items.map((item, i) => {
      const bg = colors[segmentColorIndex(i, count, colors.length)];
      const angle = segmentCenterAngle(i, count) - 90;
      return (
        <View
          key={item.id}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: radius - lineHeight / 2,
            width: size,
            height: lineHeight,
            justifyContent: 'center',
            paddingLeft: radius + hubEdge + 6,
            paddingRight: rimWidth + 8,
            transform: [{ rotate: `${angle}deg` }],
          }}
        >
          <AppText
            numberOfLines={1}
            weight="semibold"
            align="right"
            style={{
              color: readableTextColor(bg),
              fontSize: labelLayout.fontSize,
              lineHeight,
            }}
          >
            {truncateLabel(item.displayName, labelLayout.maxChars)}
          </AppText>
        </View>
      );
    });
  }, [items, count, labelLayout, colors, radius, size, rimWidth, hubSize, locale]);

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('wheelLabel', { count })}
    >
      <Animated.View style={[{ width: size, height: size }, wheelStyle]} renderToHardwareTextureAndroid>
        {artwork}
        {labels}
      </Animated.View>
      <View style={styles.pointer} pointerEvents="none">
        <WheelPointer width={Math.max(28, size * 0.095)} />
      </View>
      <View style={styles.center} pointerEvents="box-none">
        <WheelCenterButton
          size={hubSize}
          label={spinLabel}
          disabled={spinDisabled}
          onPress={onSpinPress}
          accessibilityHint={spinHint}
        />
      </View>
    </View>
  );
}

export const SpinWheel = memo(forwardRef(SpinWheelBase));

const styles = StyleSheet.create(() => ({
  pointer: { position: 'absolute', top: -6, left: 0, right: 0, alignItems: 'center' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
}));

