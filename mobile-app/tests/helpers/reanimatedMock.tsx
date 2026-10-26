/* eslint-disable @typescript-eslint/no-require-imports */
// A tiny stand-in for Reanimated/Worklets in Jest. Animations resolve instantly: `withTiming` sets the
// final value and calls its completion callback, so tests can assert what happens "after the spin".
const React = require('react');
const { View } = require('react-native');

const makeLayout = () => {
  const chain: Record<string, unknown> = {};
  const self = new Proxy(chain, { get: () => () => self });
  return self;
};

export const reanimatedMock = {
  __esModule: true,
  default: { View, Text: require('react-native').Text, createAnimatedComponent: (c: unknown) => c },
  Easing: { bezier: () => (t: number) => t, out: (f: unknown) => f, cubic: (t: number) => t, linear: (t: number) => t },
  useSharedValue: (initial: unknown) => {
    const ref = React.useRef({ value: initial });
    return ref.current;
  },
  useAnimatedStyle: (fn: () => unknown) => fn(),
  useAnimatedReaction: () => undefined,
  useReducedMotion: () => false,
  useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
  withTiming: (to: unknown, _config?: unknown, cb?: (finished: boolean) => void) => {
    cb?.(true);
    return to;
  },
  withSpring: (to: unknown) => to,
  withDelay: (_d: number, v: unknown) => v,
  withSequence: (...v: unknown[]) => v[v.length - 1],
  cancelAnimation: () => undefined,
  interpolate: (x: number, input: number[], output: number[]) => {
    const t = (x - input[0]) / (input[input.length - 1] - input[0] || 1);
    return output[0] + t * (output[output.length - 1] - output[0]);
  },
  runOnJS: (fn: (...a: unknown[]) => unknown) => fn,
  FadeInDown: makeLayout(),
  FadeOutDown: makeLayout(),
  FadeIn: makeLayout(),
  FadeOut: makeLayout(),
  ZoomIn: makeLayout(),
};

export const workletsMock = {
  __esModule: true,
  scheduleOnRN: (fn: (...a: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
  scheduleOnUI: (fn: (...a: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
};
