import type { DrawRules } from '../types';

/** A random number generator returning a float in [0, 1). Injectable for deterministic tests. */
export type Rng = () => number;

/** Practical ceiling on winners when repeats are allowed (there is no natural pool limit). */
export const MAX_REPEAT_WINNERS = 50;

/**
 * Default RNG: uses the platform CSPRNG (`crypto.getRandomValues`) when available, otherwise
 * `Math.random`. Pickzy uses this for fair, unpredictable picks in everyday giveaways. It is NOT
 * a certified or auditable lottery system, and the app makes no cryptographic-fairness claims.
 */
export function createDefaultRng(): Rng {
  const cryptoLike = (globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } })
    .crypto;
  if (cryptoLike?.getRandomValues) {
    const buffer = new Uint32Array(2);
    return () => {
      cryptoLike.getRandomValues!(buffer);
      // 53 random bits -> uniform float in [0, 1)
      return ((buffer[0] >>> 5) * 67108864 + (buffer[1] >>> 6)) / 9007199254740992;
    };
  }
  return Math.random;
}

/**
 * Uniform integer in [0, length). `Math.floor(r * length)` with r uniform in [0,1) maps each index
 * to an interval of identical size, so there is no modulo bias.
 */
export function randomIndex(length: number, rng: Rng): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError('randomIndex needs a positive integer length');
  }
  const index = Math.floor(rng() * length);
  return Math.min(Math.max(index, 0), length - 1); // guards against a faulty rng returning 1 or <0
}

/** Rules are normalized so conflicting options cannot reach the selection logic. */
export function normalizeRules(rules: DrawRules): DrawRules {
  const count = Number.isFinite(rules.requestedWinnerCount)
    ? Math.max(1, Math.floor(rules.requestedWinnerCount))
    : 1;
  const remove = !!rules.removeSelectedWinners;
  return {
    requestedWinnerCount: count,
    removeSelectedWinners: remove,
    // Removing winners from the list means they can never be drawn again in this draw.
    allowRepeatWinners: remove ? false : !!rules.allowRepeatWinners,
  };
}

export function winnersAreExcluded(rules: Pick<DrawRules, 'allowRepeatWinners' | 'removeSelectedWinners'>) {
  return !rules.allowRepeatWinners || rules.removeSelectedWinners;
}

/** Participants that can still be drawn. */
export function getEligibleParticipants<T extends { id: number }>(
  participants: readonly T[],
  winnerParticipantIds: readonly number[],
  rules: Pick<DrawRules, 'allowRepeatWinners' | 'removeSelectedWinners'>,
): T[] {
  if (!winnersAreExcluded(rules)) return [...participants];
  const won = new Set(winnerParticipantIds);
  return participants.filter((p) => !won.has(p.id));
}

/** Highest winner count the rules allow for a roster of `participantCount` people. */
export function maxWinnerCount(
  participantCount: number,
  rules: Pick<DrawRules, 'allowRepeatWinners' | 'removeSelectedWinners'>,
): number {
  if (participantCount <= 0) return 0;
  return winnersAreExcluded(rules) ? participantCount : MAX_REPEAT_WINNERS;
}

export type WinnerCountValidation =
  | { ok: true; count: number; max: number }
  | { ok: false; code: 'NOT_INTEGER' | 'TOO_LOW' | 'NO_PARTICIPANTS' | 'EXCEEDS_POOL'; max: number };

export function validateWinnerCount(
  requested: number,
  participantCount: number,
  rules: Pick<DrawRules, 'allowRepeatWinners' | 'removeSelectedWinners'>,
): WinnerCountValidation {
  const max = maxWinnerCount(participantCount, rules);
  if (!Number.isInteger(requested)) return { ok: false, code: 'NOT_INTEGER', max };
  if (requested < 1) return { ok: false, code: 'TOO_LOW', max };
  if (participantCount <= 0) return { ok: false, code: 'NO_PARTICIPANTS', max };
  if (requested > max) return { ok: false, code: 'EXCEEDS_POOL', max };
  return { ok: true, count: requested, max };
}

export type SelectionFailure = 'NO_PARTICIPANTS' | 'NO_ELIGIBLE' | 'DRAW_COMPLETE';

export type SelectionResult<T> =
  | {
      ok: true;
      winner: T;
      /** Index of the winner inside the eligible pool (the wheel's segments). */
      poolIndex: number;
      pool: T[];
      /** 1-based position of this winner in the draw. */
      order: number;
    }
  | { ok: false; code: SelectionFailure };

export interface SelectNextWinnerInput<T extends { id: number }> {
  participants: readonly T[];
  /** Participant ids of winners already drawn, in order. */
  winnerParticipantIds: readonly number[];
  rules: DrawRules;
  rng: Rng;
}

/**
 * Picks the next winner. Pure and deterministic given the rng. The returned `poolIndex` is what the
 * wheel animates to: the animation visualizes this result, it never decides it.
 */
export function selectNextWinner<T extends { id: number }>(
  input: SelectNextWinnerInput<T>,
): SelectionResult<T> {
  const rules = normalizeRules(input.rules);
  if (input.participants.length === 0) return { ok: false, code: 'NO_PARTICIPANTS' };
  if (input.winnerParticipantIds.length >= rules.requestedWinnerCount) {
    return { ok: false, code: 'DRAW_COMPLETE' };
  }
  const pool = getEligibleParticipants(input.participants, input.winnerParticipantIds, rules);
  if (pool.length === 0) return { ok: false, code: 'NO_ELIGIBLE' };
  const poolIndex = randomIndex(pool.length, input.rng);
  return {
    ok: true,
    winner: pool[poolIndex],
    poolIndex,
    pool,
    order: input.winnerParticipantIds.length + 1,
  };
}

/** Status of a draw given its roster and winners (used by the UI for buttons and progress). */
export type DrawProgress =
  | { kind: 'ready'; remaining: number; eligible: number }
  | { kind: 'complete' }
  | { kind: 'exhausted' }
  | { kind: 'empty' };

export function getDrawProgress(
  participantCount: number,
  winnerParticipantIds: readonly number[],
  rules: DrawRules,
): DrawProgress {
  const normalized = normalizeRules(rules);
  if (participantCount === 0) return { kind: 'empty' };
  if (winnerParticipantIds.length >= normalized.requestedWinnerCount) return { kind: 'complete' };
  const eligible = winnersAreExcluded(normalized)
    ? participantCount - new Set(winnerParticipantIds).size
    : participantCount;
  if (eligible <= 0) return { kind: 'exhausted' };
  return {
    kind: 'ready',
    remaining: normalized.requestedWinnerCount - winnerParticipantIds.length,
    eligible,
  };
}
