import {
  getDrawProgress,
  getEligibleParticipants,
  maxWinnerCount,
  normalizeRules,
  randomIndex,
  selectNextWinner,
  validateWinnerCount,
} from '@/features/wheel/services/winnerSelection';
import type { DrawRules } from '@/features/wheel/types';
import { seededRng, sequenceRng } from '../helpers/rng';

const people = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `P${i + 1}` }));
const rules = (over: Partial<DrawRules> = {}): DrawRules => ({
  requestedWinnerCount: 1,
  allowRepeatWinners: false,
  removeSelectedWinners: false,
  ...over,
});

describe('randomIndex', () => {
  it('maps equal intervals of the rng to equal indexes (no modulo bias)', () => {
    expect(randomIndex(4, () => 0)).toBe(0);
    expect(randomIndex(4, () => 0.2499)).toBe(0);
    expect(randomIndex(4, () => 0.25)).toBe(1);
    expect(randomIndex(4, () => 0.5)).toBe(2);
    expect(randomIndex(4, () => 0.9999)).toBe(3);
  });

  it('never leaves the valid range even if the rng misbehaves', () => {
    expect(randomIndex(5, () => 1)).toBe(4);
    expect(randomIndex(5, () => -0.5)).toBe(0);
  });

  it('rejects empty or invalid lengths', () => {
    expect(() => randomIndex(0, Math.random)).toThrow(RangeError);
    expect(() => randomIndex(2.5, Math.random)).toThrow(RangeError);
  });

  it('is statistically uniform over many draws', () => {
    const rng = seededRng(12345);
    const counts = new Array(6).fill(0);
    const n = 60000;
    for (let i = 0; i < n; i++) counts[randomIndex(6, rng)] += 1;
    for (const c of counts) expect(Math.abs(c - n / 6) / (n / 6)).toBeLessThan(0.04);
  });
});

describe('normalizeRules', () => {
  it('forces repeat winners off when winners are removed from the list', () => {
    expect(normalizeRules(rules({ allowRepeatWinners: true, removeSelectedWinners: true }))).toEqual({
      requestedWinnerCount: 1,
      allowRepeatWinners: false,
      removeSelectedWinners: true,
    });
  });

  it('sanitizes the winner count', () => {
    expect(normalizeRules(rules({ requestedWinnerCount: 0 })).requestedWinnerCount).toBe(1);
    expect(normalizeRules(rules({ requestedWinnerCount: 2.9 })).requestedWinnerCount).toBe(2);
    expect(normalizeRules(rules({ requestedWinnerCount: NaN })).requestedWinnerCount).toBe(1);
  });
});

describe('eligibility', () => {
  it('excludes previous winners unless repeats are allowed', () => {
    const list = people(4);
    expect(getEligibleParticipants(list, [2, 3], rules()).map((p) => p.id)).toEqual([1, 4]);
    expect(getEligibleParticipants(list, [2, 3], rules({ allowRepeatWinners: true })).map((p) => p.id)).toEqual([1, 2, 3, 4]);
  });

  it('keeps excluding winners when they are being removed from the list', () => {
    const list = people(3);
    const r = rules({ allowRepeatWinners: true, removeSelectedWinners: true });
    expect(getEligibleParticipants(list, [1], r).map((p) => p.id)).toEqual([2, 3]);
  });
});

describe('winner count validation', () => {
  it('limits the count to the pool when winners cannot repeat', () => {
    expect(validateWinnerCount(3, 3, rules())).toEqual({ ok: true, count: 3, max: 3 });
    expect(validateWinnerCount(4, 3, rules())).toEqual({ ok: false, code: 'EXCEEDS_POOL', max: 3 });
  });

  it('allows more winners than people when repeats are allowed (up to the cap)', () => {
    const r = rules({ allowRepeatWinners: true });
    expect(validateWinnerCount(5, 2, r).ok).toBe(true);
    expect(maxWinnerCount(2, r)).toBe(50);
    expect(validateWinnerCount(51, 2, r).ok).toBe(false);
  });

  it('rejects invalid counts and empty rosters', () => {
    expect(validateWinnerCount(0, 5, rules())).toMatchObject({ ok: false, code: 'TOO_LOW' });
    expect(validateWinnerCount(1.5, 5, rules())).toMatchObject({ ok: false, code: 'NOT_INTEGER' });
    expect(validateWinnerCount(1, 0, rules())).toMatchObject({ ok: false, code: 'NO_PARTICIPANTS' });
  });
});

describe('selectNextWinner', () => {
  it('picks the participant addressed by the rng and reports its wheel index', () => {
    const result = selectNextWinner({ participants: people(5), winnerParticipantIds: [], rules: rules(), rng: () => 0.45 });
    expect(result.ok && result.winner.id).toBe(3);
    expect(result.ok && result.poolIndex).toBe(2);
    expect(result.ok && result.order).toBe(1);
  });

  it('draws only from the remaining pool and the pool index refers to that pool', () => {
    const result = selectNextWinner({
      participants: people(5),
      winnerParticipantIds: [1, 2],
      rules: rules({ requestedWinnerCount: 3 }),
      rng: () => 0,
    });
    expect(result.ok && result.pool.map((p) => p.id)).toEqual([3, 4, 5]);
    expect(result.ok && result.winner.id).toBe(3);
    expect(result.ok && result.order).toBe(3);
  });

  it('never repeats a winner when repeats are not allowed (exhaustive over many seeds)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = seededRng(seed);
      const won: number[] = [];
      const r = rules({ requestedWinnerCount: 6 });
      for (let i = 0; i < 6; i++) {
        const res = selectNextWinner({ participants: people(6), winnerParticipantIds: won, rules: r, rng });
        if (!res.ok) throw new Error('unexpected failure');
        expect(won).not.toContain(res.winner.id);
        won.push(res.winner.id);
      }
      expect(new Set(won).size).toBe(6);
    }
  });

  it('can pick the same person twice when repeats are allowed', () => {
    const r = rules({ requestedWinnerCount: 2, allowRepeatWinners: true });
    const rng = sequenceRng([0, 0]);
    const first = selectNextWinner({ participants: people(3), winnerParticipantIds: [], rules: r, rng });
    const second = selectNextWinner({ participants: people(3), winnerParticipantIds: [1], rules: r, rng });
    expect(first.ok && first.winner.id).toBe(1);
    expect(second.ok && second.winner.id).toBe(1);
  });

  it('handles a single participant', () => {
    const res = selectNextWinner({ participants: people(1), winnerParticipantIds: [], rules: rules(), rng: Math.random });
    expect(res.ok && res.winner.id).toBe(1);
    expect(res.ok && res.poolIndex).toBe(0);
  });

  it('fails cleanly for empty, exhausted and completed draws', () => {
    expect(selectNextWinner({ participants: [], winnerParticipantIds: [], rules: rules(), rng: Math.random })).toEqual({
      ok: false,
      code: 'NO_PARTICIPANTS',
    });
    expect(
      selectNextWinner({ participants: people(2), winnerParticipantIds: [1, 2], rules: rules({ requestedWinnerCount: 3 }), rng: Math.random }),
    ).toEqual({ ok: false, code: 'NO_ELIGIBLE' });
    expect(selectNextWinner({ participants: people(2), winnerParticipantIds: [1], rules: rules(), rng: Math.random })).toEqual({
      ok: false,
      code: 'DRAW_COMPLETE',
    });
  });

  it('picks every participant about equally often over many draws', () => {
    const rng = seededRng(99);
    const counts: Record<number, number> = {};
    const n = 30000;
    for (let i = 0; i < n; i++) {
      const res = selectNextWinner({ participants: people(5), winnerParticipantIds: [], rules: rules(), rng });
      if (res.ok) counts[res.winner.id] = (counts[res.winner.id] ?? 0) + 1;
    }
    for (const id of [1, 2, 3, 4, 5]) expect(Math.abs(counts[id] - n / 5) / (n / 5)).toBeLessThan(0.05);
  });
});

describe('getDrawProgress', () => {
  it('describes the draw state for the UI', () => {
    expect(getDrawProgress(0, [], rules())).toEqual({ kind: 'empty' });
    expect(getDrawProgress(3, [], rules({ requestedWinnerCount: 2 }))).toEqual({ kind: 'ready', remaining: 2, eligible: 3 });
    expect(getDrawProgress(3, [1], rules({ requestedWinnerCount: 2 }))).toEqual({ kind: 'ready', remaining: 1, eligible: 2 });
    expect(getDrawProgress(3, [1, 2], rules({ requestedWinnerCount: 2 }))).toEqual({ kind: 'complete' });
    expect(getDrawProgress(2, [1, 2], rules({ requestedWinnerCount: 3 }))).toEqual({ kind: 'exhausted' });
  });
});
