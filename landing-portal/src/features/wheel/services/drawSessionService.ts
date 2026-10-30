import type { PickzyDatabase } from '@/lib/db/database';
import { inTransaction } from '@/lib/db/transaction';
import { createDrawRepository } from '@/lib/db/repositories/drawRepository';
import { createParticipantRepository } from '@/lib/db/repositories/participantRepository';
import { createProjectRepository } from '@/lib/db/repositories/projectRepository';
import type { Participant } from '@/features/participants/types';
import type {
  DrawParticipant,
  DrawRules,
  DrawSession,
  DrawSnapshot,
  DrawWinnerWithName,
} from '../types';
import {
  createDefaultRng,
  maxWinnerCount,
  normalizeRules,
  selectNextWinner,
  validateWinnerCount,
  type Rng,
} from './winnerSelection';

export type DrawErrorCode =
  | 'NOT_FOUND'
  | 'NOT_ACTIVE'
  | 'PROJECT_NOT_FOUND'
  | 'NO_PARTICIPANTS'
  | 'NO_ELIGIBLE'
  | 'DRAW_COMPLETE'
  | 'PENDING_REVEAL'
  | 'INVALID_WINNER_COUNT'
  | 'BELOW_DRAWN'
  | 'NOTHING_DRAWN';

export class DrawError extends Error {
  readonly code: DrawErrorCode;
  /** Extra info, e.g. the maximum allowed winner count for INVALID_WINNER_COUNT. */
  readonly detail?: { max?: number; drawn?: number };
  constructor(code: DrawErrorCode, detail?: DrawError['detail']) {
    super(code);
    this.name = 'DrawError';
    this.code = code;
    this.detail = detail;
  }
}

/**
 * What `syncRoster` did when the project's participant list differs from the draw's snapshot.
 * - `in_sync`: nothing changed.
 * - `resnapshotted`: the list changed before any winner was picked, so the snapshot was refreshed.
 * - `reset`: the list changed after winners were picked; the draw restarted with the new list and
 *   the winners picked so far were discarded (completed History is never touched).
 */
export type SyncOutcome = 'in_sync' | 'resnapshotted' | 'reset' | 'detached' | 'not_active';

export interface SpinOutcome {
  winner: DrawWinnerWithName;
  /** Index of the winner in `pool`, i.e. the wheel segment the animation must stop on. */
  poolIndex: number;
  /** Eligible participants at the moment of selection (the wheel's segments). */
  pool: DrawParticipant[];
  order: number;
  requested: number;
}

export interface FinishOutcome {
  winners: DrawWinnerWithName[];
  /** Participants deleted from the project list because "remove selected winners" was on. */
  removedFromProject: number;
}

export const DEFAULT_RULES: DrawRules = {
  requestedWinnerCount: 1,
  allowRepeatWinners: false,
  removeSelectedWinners: false,
};

function sameRoster(current: readonly Participant[], snapshot: readonly DrawParticipant[]): boolean {
  if (current.length !== snapshot.length) return false;
  for (let i = 0; i < current.length; i++) {
    if (
      current[i].id !== snapshot[i].sourceParticipantId ||
      current[i].displayName !== snapshot[i].displayName
    ) {
      return false;
    }
  }
  return true;
}

export interface DrawSessionServiceOptions {
  clock?: () => number;
  rng?: Rng;
}

export function createDrawSessionService(db: PickzyDatabase, options: DrawSessionServiceOptions = {}) {
  const clock = options.clock ?? Date.now;
  const rng = options.rng ?? createDefaultRng();

  async function loadSnapshot(drawId: number): Promise<DrawSnapshot | null> {
    const draws = createDrawRepository(db);
    const session = await draws.getSession(drawId);
    if (!session) return null;
    return {
      session,
      participants: await draws.listSnapshot(drawId),
      winners: await draws.listWinners(drawId),
    };
  }

  async function takeSnapshot(
    sessionId: number,
    roster: readonly Participant[],
  ): Promise<void> {
    await createDrawRepository(db).insertSnapshot(
      sessionId,
      roster.map((p) => ({ sourceParticipantId: p.id, displayName: p.displayName })),
    );
  }

  /** Clamps a requested winner count into what the rules and roster allow (at least 1). */
  function clampRules(rules: DrawRules, participantCount: number): DrawRules {
    const normalized = normalizeRules(rules);
    const max = Math.max(1, maxWinnerCount(participantCount, normalized));
    return { ...normalized, requestedWinnerCount: Math.min(normalized.requestedWinnerCount, max) };
  }

  return {
    load: (drawId: number) => loadSnapshot(drawId),

    /**
     * Opens the project's unfinished draw if there is one (recovering an interrupted session),
     * otherwise creates a new draw whose rules start from the project's last completed draw.
     */
    async startOrResume(projectId: number): Promise<{ drawId: number; resumed: boolean }> {
      return inTransaction(db, async () => {
        const projects = createProjectRepository(db);
        const draws = createDrawRepository(db);
        const project = await projects.getById(projectId);
        if (!project) throw new DrawError('PROJECT_NOT_FOUND');
        const roster = await createParticipantRepository(db).listByProject(projectId);
        if (roster.length === 0) throw new DrawError('NO_PARTICIPANTS');

        const active = await draws.getActiveSessionForProject(projectId);
        if (active) return { drawId: active.id, resumed: true };

        const last = await draws.getLatestCompletedForProject(projectId);
        const rules = clampRules(
          last
            ? {
                requestedWinnerCount: last.requestedWinnerCount,
                allowRepeatWinners: last.allowRepeatWinners,
                removeSelectedWinners: last.removeSelectedWinners,
              }
            : DEFAULT_RULES,
          roster.length,
        );
        const now = clock();
        const drawId = await draws.insertSession({
          projectId,
          projectName: project.name,
          rules,
          now,
        });
        await takeSnapshot(drawId, roster);
        return { drawId, resumed: false };
      });
    },

    /**
     * Compares the project's current participants with the draw's snapshot and reconciles them.
     * Call whenever the spin screen opens or regains focus.
     */
    async syncRoster(drawId: number): Promise<SyncOutcome> {
      return inTransaction(db, async () => {
        const draws = createDrawRepository(db);
        const session = await draws.getSession(drawId);
        if (!session || session.status !== 'active') return 'not_active';
        if (session.projectId === null) return 'detached';

        const project = await createProjectRepository(db).getById(session.projectId);
        if (!project) return 'detached';
        const roster = await createParticipantRepository(db).listByProject(session.projectId);
        const snapshot = await draws.listSnapshot(drawId);
        const nameChanged = project.name !== session.projectName;
        if (nameChanged) await draws.updateProjectName(drawId, project.name);
        if (sameRoster(roster, snapshot)) return 'in_sync';

        const winners = await draws.listWinners(drawId);
        await draws.clearSnapshotAndWinners(drawId);
        await takeSnapshot(drawId, roster);
        // Keep the rules valid for the new roster size.
        const rules = clampRules(
          {
            requestedWinnerCount: session.requestedWinnerCount,
            allowRepeatWinners: session.allowRepeatWinners,
            removeSelectedWinners: session.removeSelectedWinners,
          },
          roster.length,
        );
        await draws.updateRules(drawId, rules, clock());
        return winners.length > 0 ? 'reset' : 'resnapshotted';
      });
    },

    /**
     * Updates the rules of an unfinished draw. Rules apply to the REMAINING spins: winners already
     * drawn are kept, so the new winner count cannot be lower than the number already drawn.
     */
    async updateRules(drawId: number, input: DrawRules): Promise<DrawRules> {
      return inTransaction(db, async () => {
        const draws = createDrawRepository(db);
        const session = await draws.getSession(drawId);
        if (!session) throw new DrawError('NOT_FOUND');
        if (session.status !== 'active') throw new DrawError('NOT_ACTIVE');
        const rules = normalizeRules(input);
        const participants = await draws.countSnapshot(drawId);
        const winners = await draws.listWinners(drawId);

        const validation = validateWinnerCount(rules.requestedWinnerCount, participants, rules);
        if (!validation.ok) {
          throw new DrawError('INVALID_WINNER_COUNT', { max: validation.max });
        }
        if (rules.requestedWinnerCount < winners.length) {
          throw new DrawError('BELOW_DRAWN', { drawn: winners.length });
        }
        await draws.updateRules(drawId, rules, clock());
        return rules;
      });
    },

    /**
     * "Pick another winner" (2nd place, 3rd place...): raises the requested winner count by one so the
     * draw can continue after the planned winners are done. Fails with NO_ELIGIBLE when nobody is left
     * under the current rules. Winners already drawn are untouched.
     */
    async addWinnerSlot(drawId: number): Promise<DrawRules> {
      return inTransaction(db, async () => {
        const draws = createDrawRepository(db);
        const session = await draws.getSession(drawId);
        if (!session) throw new DrawError('NOT_FOUND');
        if (session.status !== 'active') throw new DrawError('NOT_ACTIVE');
        const rules = normalizeRules(session);
        const winners = await draws.listWinners(drawId);
        const wanted = Math.max(rules.requestedWinnerCount, winners.length + 1);
        const validation = validateWinnerCount(wanted, await draws.countSnapshot(drawId), rules);
        if (!validation.ok) throw new DrawError('NO_ELIGIBLE', { max: validation.max });
        const next = { ...rules, requestedWinnerCount: wanted };
        await draws.updateRules(drawId, next, clock());
        return next;
      });
    },

    /**
     * Picks the next winner and SAVES it before anything is animated. The returned `poolIndex` is the
     * wheel segment to stop on. An unacknowledged winner blocks further spins, which also makes
     * accidental double taps (or a second device instance) harmless.
     */
    async spin(drawId: number): Promise<SpinOutcome> {
      return inTransaction(db, async () => {
        const draws = createDrawRepository(db);
        const session = await draws.getSession(drawId);
        if (!session) throw new DrawError('NOT_FOUND');
        if (session.status !== 'active') throw new DrawError('NOT_ACTIVE');

        const participants = await draws.listSnapshot(drawId);
        const winners = await draws.listWinners(drawId);
        if (winners.some((w) => w.revealedAt === null)) throw new DrawError('PENDING_REVEAL');

        const result = selectNextWinner({
          participants,
          winnerParticipantIds: winners.map((w) => w.drawParticipantId),
          rules: session,
          rng,
        });
        if (!result.ok) {
          throw new DrawError(result.code === 'NO_PARTICIPANTS' ? 'NO_PARTICIPANTS' : result.code);
        }

        const now = clock();
        const winnerId = await draws.insertWinner({
          sessionId: drawId,
          drawParticipantId: result.winner.id,
          order: result.order,
          now,
        });
        await draws.updateRules(drawId, session, now); // bumps updated_at
        return {
          winner: {
            id: winnerId,
            drawSessionId: drawId,
            drawParticipantId: result.winner.id,
            winnerOrder: result.order,
            selectedAt: now,
            revealedAt: null,
            displayName: result.winner.displayName,
          },
          poolIndex: result.poolIndex,
          pool: result.pool,
          order: result.order,
          requested: normalizeRules(session).requestedWinnerCount,
        };
      });
    },

    /** The winner was shown to the user; they may now continue. */
    async acknowledgeWinner(winnerId: number): Promise<void> {
      await createDrawRepository(db).markRevealed(winnerId, clock());
    },

    /**
     * Completes the draw: it becomes a History record. If "remove selected winners" is on, the winners
     * are deleted from the project's participant list in the same transaction.
     */
    async finish(drawId: number): Promise<FinishOutcome> {
      return inTransaction(db, async () => {
        const draws = createDrawRepository(db);
        const session = await draws.getSession(drawId);
        if (!session) throw new DrawError('NOT_FOUND');
        if (session.status !== 'active') throw new DrawError('NOT_ACTIVE');
        const winners = await draws.listWinners(drawId);
        if (winners.length === 0) throw new DrawError('NOTHING_DRAWN');

        const now = clock();
        await draws.markAllRevealed(drawId, now);
        await draws.markCompleted(drawId, now);

        let removedFromProject = 0;
        if (session.removeSelectedWinners && session.projectId !== null) {
          const snapshot = await draws.listSnapshot(drawId);
          const byId = new Map(snapshot.map((p) => [p.id, p]));
          const sourceIds = winners
            .map((w) => byId.get(w.drawParticipantId)?.sourceParticipantId)
            .filter((id): id is number => typeof id === 'number');
          const participants = createParticipantRepository(db);
          removedFromProject = await participants.deleteByIds(session.projectId, sourceIds);
          await participants.compactPositions(session.projectId);
          await createProjectRepository(db).touch(session.projectId, now);
        } else if (session.projectId !== null) {
          await createProjectRepository(db).touch(session.projectId, now);
        }
        return {
          winners: winners.map((w) => ({ ...w, revealedAt: w.revealedAt ?? now })),
          removedFromProject,
        };
      });
    },

    /**
     * Restarts an unfinished draw: discards its winners and re-snapshots the project's current
     * participants. Rules are kept. Completed History is never touched.
     */
    async reset(drawId: number): Promise<void> {
      await inTransaction(db, async () => {
        const draws = createDrawRepository(db);
        const session = await draws.getSession(drawId);
        if (!session) throw new DrawError('NOT_FOUND');
        if (session.status !== 'active') throw new DrawError('NOT_ACTIVE');
        await draws.clearSnapshotAndWinners(drawId);
        if (session.projectId !== null) {
          const roster = await createParticipantRepository(db).listByProject(session.projectId);
          await takeSnapshot(drawId, roster);
          const rules = clampRules(
            {
              requestedWinnerCount: session.requestedWinnerCount,
              allowRepeatWinners: session.allowRepeatWinners,
              removeSelectedWinners: session.removeSelectedWinners,
            },
            roster.length,
          );
          await draws.updateRules(drawId, rules, clock());
        }
      });
    },

    /** Convenience for tests and diagnostics. */
    async getSession(drawId: number): Promise<DrawSession | null> {
      return createDrawRepository(db).getSession(drawId);
    },
  };
}

export type DrawSessionService = ReturnType<typeof createDrawSessionService>;
