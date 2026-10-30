import {
  computeLabelLayout,
  createSpinPlan,
  normalizeDegrees,
  pointerSegmentIndex,
  polarToCartesian,
  segmentCenterAngle,
  segmentPath,
  truncateLabel,
} from '@/features/wheel/services/wheelGeometry';
import { seededRng, sequenceRng } from '../helpers/rng';

describe('angles', () => {
  it('normalizes degrees into [0, 360)', () => {
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(720)).toBe(0);
  });

  it('places segment centers evenly', () => {
    expect(segmentCenterAngle(0, 4)).toBe(45);
    expect(segmentCenterAngle(3, 4)).toBe(315);
  });

  it('converts clockwise-from-top angles to points', () => {
    const top = polarToCartesian(100, 100, 50, 0);
    const right = polarToCartesian(100, 100, 50, 90);
    expect(top.x).toBeCloseTo(100);
    expect(top.y).toBeCloseTo(50);
    expect(right.x).toBeCloseTo(150);
    expect(right.y).toBeCloseTo(100);
  });
});

describe('segmentPath', () => {
  it('builds a pie slice with the right arc flag', () => {
    expect(segmentPath(100, 100, 50, 0, 90)).toMatch(/A 50 50 0 0 1/);
    expect(segmentPath(100, 100, 50, 0, 270)).toMatch(/A 50 50 0 1 1/);
  });

  it('draws a full disc for a single participant', () => {
    const path = segmentPath(100, 100, 50, 0, 360);
    expect(path.match(/A /g)).toHaveLength(2);
  });
});

describe('pointerSegmentIndex', () => {
  it('reports the segment under the top pointer', () => {
    expect(pointerSegmentIndex(0, 4)).toBe(0);
    // rotating the wheel clockwise by 90 brings the segment that was at -90 (index 3) to the top
    expect(pointerSegmentIndex(90, 4)).toBe(3);
    expect(pointerSegmentIndex(180, 4)).toBe(2);
    expect(pointerSegmentIndex(-90, 4)).toBe(1);
    expect(pointerSegmentIndex(0, 0)).toBe(-1);
  });
});

describe('createSpinPlan: the pointer must end on the selected winner', () => {
  it('lands inside the winner segment for every size, winner and starting rotation', () => {
    const rng = seededRng(2024);
    for (const count of [1, 2, 3, 5, 8, 13, 50, 360]) {
      for (let winner = 0; winner < count; winner += Math.max(1, Math.floor(count / 12))) {
        for (const start of [0, 17.3, 359.9, 1234.5, -45]) {
          const plan = createSpinPlan({ currentRotation: start, winnerIndex: winner, segmentCount: count, rng });
          expect(plan.targetRotation).toBeGreaterThan(start + 360);
          expect(pointerSegmentIndex(plan.targetRotation, count)).toBe(winner);
        }
      }
    }
  });

  it('keeps the landing spot away from the segment borders', () => {
    for (let i = 0; i < 200; i++) {
      const plan = createSpinPlan({ currentRotation: 0, winnerIndex: 3, segmentCount: 7, rng: seededRng(i + 1) });
      expect(Math.abs(plan.offsetFraction)).toBeLessThanOrEqual(0.35);
    }
  });

  it('spins several full turns, fewer with reduced motion', () => {
    const rng = sequenceRng([0.5, 0.5]);
    expect(createSpinPlan({ currentRotation: 0, winnerIndex: 0, segmentCount: 4, rng }).fullTurns).toBeGreaterThanOrEqual(5);
    expect(createSpinPlan({ currentRotation: 0, winnerIndex: 0, segmentCount: 4, rng, reducedMotion: true }).fullTurns).toBe(1);
  });

  it('rejects impossible input', () => {
    expect(() => createSpinPlan({ currentRotation: 0, winnerIndex: 4, segmentCount: 4, rng: Math.random })).toThrow(RangeError);
    expect(() => createSpinPlan({ currentRotation: 0, winnerIndex: 0, segmentCount: 0, rng: Math.random })).toThrow(RangeError);
  });
});

describe('label layout', () => {
  it('shows labels on small wheels and hides them when slices are too thin', () => {
    expect(computeLabelLayout(6, 170).visible).toBe(true);
    expect(computeLabelLayout(200, 170).visible).toBe(false);
  });

  it('shrinks the font as the wheel gets denser but never below the minimum', () => {
    const few = computeLabelLayout(6, 170);
    const many = computeLabelLayout(30, 170);
    if (many.visible) {
      expect(many.fontSize).toBeLessThanOrEqual(few.fontSize);
      expect(many.fontSize).toBeGreaterThanOrEqual(9);
    }
  });

  it('truncates long names with an ellipsis, counting Bengali characters correctly', () => {
    expect(truncateLabel('Abdullah Al Maksud', 8)).toBe('Abdullah…'.slice(0, 7) + '…');
    expect(truncateLabel('Rahim', 8)).toBe('Rahim');
    const bn = truncateLabel('আব্দুল্লাহ আল মাকসুদ', 6);
    expect(Array.from(bn).length).toBeLessThanOrEqual(6);
    expect(bn.endsWith('…')).toBe(true);
  });
});
