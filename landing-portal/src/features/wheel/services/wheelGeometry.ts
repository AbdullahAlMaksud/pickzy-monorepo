import type { Rng } from './winnerSelection';

/**
 * Wheel geometry. Angles are in degrees, measured CLOCKWISE from the top (12 o'clock), where the
 * pointer sits. Segment `i` of `n` covers [i*360/n, (i+1)*360/n) in the wheel's own frame.
 * Rotating the wheel clockwise by R degrees moves the wheel-frame angle `-R` under the pointer.
 */

export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function segmentAngle(segmentCount: number): number {
  return 360 / segmentCount;
}

export function segmentCenterAngle(index: number, segmentCount: number): number {
  return (index + 0.5) * segmentAngle(segmentCount);
}

/** Converts a clockwise-from-top angle to an SVG point. */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const fmt = (n: number) => Math.round(n * 1000) / 1000;

/** SVG path of a pie slice from `startDeg` to `endDeg` (clockwise from top). */
export function segmentPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const sweep = endDeg - startDeg;
  if (sweep >= 359.999) {
    // A single participant: the slice is the whole disc (an SVG arc cannot draw a full circle).
    return (
      `M ${fmt(cx - r)} ${fmt(cy)} ` +
      `A ${fmt(r)} ${fmt(r)} 0 1 1 ${fmt(cx + r)} ${fmt(cy)} ` +
      `A ${fmt(r)} ${fmt(r)} 0 1 1 ${fmt(cx - r)} ${fmt(cy)} Z`
    );
  }
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = sweep > 180 ? 1 : 0;
  return (
    `M ${fmt(cx)} ${fmt(cy)} L ${fmt(start.x)} ${fmt(start.y)} ` +
    `A ${fmt(r)} ${fmt(r)} 0 ${largeArc} 1 ${fmt(end.x)} ${fmt(end.y)} Z`
  );
}

/** Which segment is under the pointer when the wheel is rotated by `rotationDeg`. */
export function pointerSegmentIndex(rotationDeg: number, segmentCount: number): number {
  if (segmentCount <= 0) return -1;
  const wheelAngle = normalizeDegrees(-rotationDeg);
  const index = Math.floor(wheelAngle / segmentAngle(segmentCount));
  return Math.min(index, segmentCount - 1);
}

export interface SpinPlanInput {
  currentRotation: number;
  winnerIndex: number;
  segmentCount: number;
  rng: Rng;
  reducedMotion?: boolean;
}

export interface SpinPlan {
  /** Final absolute rotation in degrees (always > currentRotation). */
  targetRotation: number;
  /** Where inside the winning segment the pointer lands, from -0.35 to +0.35 of the segment. */
  offsetFraction: number;
  fullTurns: number;
}

/**
 * Computes the final rotation so the pointer ends inside the winner's segment.
 * `offsetFraction` keeps the landing spot away from segment borders (never exactly on a line) while
 * still looking natural.
 */
export function createSpinPlan({
  currentRotation,
  winnerIndex,
  segmentCount,
  rng,
  reducedMotion = false,
}: SpinPlanInput): SpinPlan {
  if (!Number.isInteger(segmentCount) || segmentCount <= 0) {
    throw new RangeError('segmentCount must be a positive integer');
  }
  if (!Number.isInteger(winnerIndex) || winnerIndex < 0 || winnerIndex >= segmentCount) {
    throw new RangeError('winnerIndex is outside the wheel');
  }
  const seg = segmentAngle(segmentCount);
  const offsetFraction = (rng() - 0.5) * 0.7;
  const fullTurns = reducedMotion ? 1 : 5 + Math.floor(rng() * 3);

  const landingWheelAngle = winnerIndex * seg + seg * (0.5 + offsetFraction);
  // Smallest non-negative extra rotation so that -(R) === landingWheelAngle (mod 360)
  const delta = normalizeDegrees(-landingWheelAngle - currentRotation);
  return {
    targetRotation: currentRotation + fullTurns * 360 + delta,
    offsetFraction,
    fullTurns,
  };
}

export interface LabelLayout {
  visible: boolean;
  fontSize: number;
  maxChars: number;
}

export const LABEL_MIN_FONT = 9;
export const LABEL_MAX_FONT = 19;

/**
 * Chooses a label size so that text fits inside its sector. If the sectors are too thin for
 * readable text, labels are hidden (the wheel stays clean and the participant list is shown instead).
 */
export function computeLabelLayout(segmentCount: number, wheelRadius: number): LabelLayout {
  if (segmentCount <= 0) return { visible: false, fontSize: 0, maxChars: 0 };
  const hubRadius = wheelRadius * 0.27;
  const outer = wheelRadius * 0.93;
  const radialLength = outer - hubRadius - wheelRadius * 0.04;
  // Width available at the inner end of the text (narrowest point of the slice).
  const innerArc = (2 * Math.PI * (hubRadius + wheelRadius * 0.12)) / segmentCount;
  const fontSize = Math.min(LABEL_MAX_FONT, innerArc * 0.62);
  if (fontSize < LABEL_MIN_FONT) return { visible: false, fontSize: 0, maxChars: 0 };
  const maxChars = Math.max(3, Math.floor(radialLength / (fontSize * 0.6)));
  return { visible: true, fontSize, maxChars };
}

export function truncateLabel(name: string, maxChars: number): string {
  const chars = Array.from(name);
  if (chars.length <= maxChars) return name;
  return `${chars.slice(0, Math.max(1, maxChars - 1)).join('').trimEnd()}…`;
}
