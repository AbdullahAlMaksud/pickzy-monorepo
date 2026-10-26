import { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { durations, wheelPalette } from '@/theme/tokens';

interface ConfettiEffectProps {
  /** Changing this value restarts the burst (use the winner id). */
  burstKey: string | number;
  active: boolean;
  /** Particle count is capped: confetti must stay smooth on average Android devices. */
  count?: number;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  drift: number;
  delay: number;
  size: number;
  color: string;
  spin: number;
  round: boolean;
}

/** Deterministic pseudo-random sequence so renders are stable for the same burst. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeParticles(seed: number, count: number, width: number): Particle[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * width,
    drift: (rand() - 0.5) * 120,
    delay: rand() * 0.35,
    size: 6 + rand() * 7,
    color: wheelPalette[Math.floor(rand() * wheelPalette.length)],
    spin: (rand() < 0.5 ? -1 : 1) * (360 + rand() * 540),
    round: rand() < 0.3,
  }));
}

const PieceView = memo(function Piece({
  particle,
  progress,
  height,
}: {
  particle: Particle;
  progress: SharedValue<number>;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (progress.value - particle.delay) / (1 - particle.delay)));
    return {
      opacity: interpolate(p, [0, 0.08, 0.8, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: particle.drift * p },
        { translateY: interpolate(p, [0, 1], [-30, height + 30]) },
        { rotate: `${particle.spin * p}deg` },
        { rotateX: `${particle.spin * 0.6 * p}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: particle.x,
          top: 0,
          width: particle.size,
          height: particle.round ? particle.size : particle.size * 1.6,
          borderRadius: particle.round ? particle.size / 2 : 2,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
});

/**
 * Lightweight confetti: ~40 plain views driven by one Reanimated shared value on the UI thread.
 * It is decorative only (hidden from screen readers) and the caller disables it for reduced motion.
 */
function ConfettiEffectBase({ burstKey, active, count = 40, width, height }: ConfettiEffectProps) {
  const progress = useSharedValue(0);
  const particles = useMemo(
    () => makeParticles(hashKey(burstKey), Math.min(count, 60), width),
    [burstKey, count, width],
  );

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (active) {
      progress.value = withTiming(1, { duration: durations.confetti, easing: Easing.out(Easing.quad) });
    }
    return () => cancelAnimation(progress);
  }, [active, burstKey, progress]);

  if (!active) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.layer, { width, height }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {particles.map((particle, i) => (
        <PieceView key={i} particle={particle} progress={progress} height={height} />
      ))}
    </View>
  );
}

function hashKey(key: string | number): number {
  const s = String(key);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const ConfettiEffect = memo(ConfettiEffectBase);

const styles = StyleSheet.create(() => ({
  layer: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
}));
