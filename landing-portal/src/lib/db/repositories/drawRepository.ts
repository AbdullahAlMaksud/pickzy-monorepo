import type { DrawParticipant, DrawRules, DrawSession, DrawWinnerWithName } from '@/features/wheel/types';
import type { PickzyDatabase } from '../database';

export interface SnapshotInput {
  sourceParticipantId: number | null;
  displayName: string;
}

export function createDrawRepository(db: PickzyDatabase) {
  async function listSnapshot(sessionId: number): Promise<DrawParticipant[]> {
    return db.drawParticipants.where('drawSessionId').equals(sessionId).sortBy('position');
  }

  async function listWinners(sessionId: number): Promise<DrawWinnerWithName[]> {
    const winners = await db.drawWinners.where('drawSessionId').equals(sessionId).sortBy('winnerOrder');
    const people = new Map((await listSnapshot(sessionId)).map((p) => [p.id, p.displayName]));
    return winners.map((w) => ({ ...w, displayName: people.get(w.drawParticipantId) ?? '' }));
  }

  const rulesOf = (r: DrawRules): DrawRules => ({
    requestedWinnerCount: r.requestedWinnerCount,
    allowRepeatWinners: r.allowRepeatWinners,
    removeSelectedWinners: r.removeSelectedWinners,
  });

  return {
    listSnapshot,
    listWinners,

    async getSession(id: number): Promise<DrawSession | null> {
      return (await db.drawSessions.get(id)) ?? null;
    },

    /** At most one unfinished draw exists per project (enforced by the service inside a transaction). */
    async getActiveSessionForProject(projectId: number): Promise<DrawSession | null> {
      const sessions = await db.drawSessions.where('projectId').equals(projectId).toArray();
      return sessions.find((s) => s.status === 'active') ?? null;
    },

    async getLatestCompletedForProject(projectId: number): Promise<DrawSession | null> {
      const sessions = await db.drawSessions.where('projectId').equals(projectId).toArray();
      return (
        sessions
          .filter((s) => s.status === 'completed')
          .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0] ?? null
      );
    },

    async insertSession(input: {
      projectId: number;
      projectName: string;
      rules: DrawRules;
      now: number;
    }): Promise<number> {
      return db.drawSessions.add({
        projectId: input.projectId,
        projectName: input.projectName,
        ...rulesOf(input.rules),
        status: 'active',
        startedAt: input.now,
        completedAt: null,
        createdAt: input.now,
        updatedAt: input.now,
      } as DrawSession);
    },

    async updateRules(id: number, rules: DrawRules, now: number): Promise<void> {
      await db.drawSessions.update(id, { ...rulesOf(rules), updatedAt: now });
    },

    async updateProjectName(id: number, projectName: string): Promise<void> {
      await db.drawSessions.update(id, { projectName });
    },

    async markCompleted(id: number, now: number): Promise<void> {
      await db.drawSessions.update(id, { status: 'completed', completedAt: now, updatedAt: now });
    },

    async insertSnapshot(sessionId: number, items: readonly SnapshotInput[]): Promise<void> {
      await db.drawParticipants.bulkAdd(
        items.map(
          (item, position) =>
            ({
              drawSessionId: sessionId,
              sourceParticipantId: item.sourceParticipantId,
              displayName: item.displayName,
              position,
            }) as DrawParticipant,
        ),
      );
    },

    countSnapshot(sessionId: number): Promise<number> {
      return db.drawParticipants.where('drawSessionId').equals(sessionId).count();
    },

    async clearSnapshotAndWinners(sessionId: number): Promise<void> {
      await db.drawWinners.where('drawSessionId').equals(sessionId).delete();
      await db.drawParticipants.where('drawSessionId').equals(sessionId).delete();
    },

    async insertWinner(input: {
      sessionId: number;
      drawParticipantId: number;
      order: number;
      now: number;
    }): Promise<number> {
      return db.drawWinners.add({
        drawSessionId: input.sessionId,
        drawParticipantId: input.drawParticipantId,
        winnerOrder: input.order,
        selectedAt: input.now,
        revealedAt: null,
      } as never);
    },

    async markRevealed(winnerId: number, now: number): Promise<void> {
      await db.drawWinners.update(winnerId, { revealedAt: now });
    },

    async markAllRevealed(sessionId: number, now: number): Promise<void> {
      await db.drawWinners
        .where('drawSessionId')
        .equals(sessionId)
        .filter((w) => w.revealedAt === null)
        .modify({ revealedAt: now });
    },

    /** An unfinished draw of a deleted project is discarded together with its snapshot. */
    async deleteActiveSessionsForProject(projectId: number): Promise<void> {
      const active = (await db.drawSessions.where('projectId').equals(projectId).toArray()).filter(
        (s) => s.status === 'active',
      );
      for (const session of active) {
        await db.drawWinners.where('drawSessionId').equals(session.id).delete();
        await db.drawParticipants.where('drawSessionId').equals(session.id).delete();
        await db.drawSessions.delete(session.id);
      }
    },

    /** History keeps completed draws after the project is gone: they just lose the link. */
    async detachProject(projectId: number): Promise<void> {
      await db.drawSessions.where('projectId').equals(projectId).modify({ projectId: null });
    },
  };
}
