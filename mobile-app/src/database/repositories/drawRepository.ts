import type {
  DrawParticipant,
  DrawRules,
  DrawSession,
  DrawStatus,
  DrawWinner,
  DrawWinnerWithName,
} from '@/features/wheel/types';
import { chunk } from '../transactions';
import type { SqlExecutor } from '../types';

interface SessionRow {
  id: number;
  project_id: number | null;
  project_name: string;
  status: DrawStatus;
  requested_winner_count: number;
  allow_repeat_winners: number;
  remove_selected_winners: number;
  started_at: number;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
}

interface DrawParticipantRow {
  id: number;
  draw_session_id: number;
  source_participant_id: number | null;
  display_name: string;
  position: number;
}

interface WinnerRow {
  id: number;
  draw_session_id: number;
  draw_participant_id: number;
  winner_order: number;
  selected_at: number;
  revealed_at: number | null;
  display_name?: string;
}

const mapSession = (r: SessionRow): DrawSession => ({
  id: r.id,
  projectId: r.project_id,
  projectName: r.project_name,
  status: r.status,
  requestedWinnerCount: r.requested_winner_count,
  allowRepeatWinners: r.allow_repeat_winners === 1,
  removeSelectedWinners: r.remove_selected_winners === 1,
  startedAt: r.started_at,
  completedAt: r.completed_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapDrawParticipant = (r: DrawParticipantRow): DrawParticipant => ({
  id: r.id,
  drawSessionId: r.draw_session_id,
  sourceParticipantId: r.source_participant_id,
  displayName: r.display_name,
  position: r.position,
});

const mapWinner = (r: WinnerRow): DrawWinner => ({
  id: r.id,
  drawSessionId: r.draw_session_id,
  drawParticipantId: r.draw_participant_id,
  winnerOrder: r.winner_order,
  selectedAt: r.selected_at,
  revealedAt: r.revealed_at,
});

const SNAPSHOT_CHUNK = 200; // 4 values per row

export interface SnapshotInput {
  sourceParticipantId: number | null;
  displayName: string;
}

export function createDrawRepository(db: SqlExecutor) {
  return {
    async insertSession(input: {
      projectId: number | null;
      projectName: string;
      rules: DrawRules;
      now: number;
    }): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO draw_sessions
           (project_id, project_name, status, requested_winner_count, allow_repeat_winners,
            remove_selected_winners, started_at, completed_at, created_at, updated_at)
         VALUES (?, ?, 'active', ?, ?, ?, ?, NULL, ?, ?)`,
        [
          input.projectId,
          input.projectName,
          input.rules.requestedWinnerCount,
          input.rules.allowRepeatWinners ? 1 : 0,
          input.rules.removeSelectedWinners ? 1 : 0,
          input.now,
          input.now,
          input.now,
        ],
      );
      return result.lastInsertRowId;
    },

    async getSession(id: number): Promise<DrawSession | null> {
      const row = await db.getFirstAsync<SessionRow>(`SELECT * FROM draw_sessions WHERE id = ?`, [id]);
      return row ? mapSession(row) : null;
    },

    async getActiveSessionForProject(projectId: number): Promise<DrawSession | null> {
      const row = await db.getFirstAsync<SessionRow>(
        `SELECT * FROM draw_sessions WHERE project_id = ? AND status = 'active'
         ORDER BY id DESC LIMIT 1`,
        [projectId],
      );
      return row ? mapSession(row) : null;
    },

    async getLatestCompletedForProject(projectId: number): Promise<DrawSession | null> {
      const row = await db.getFirstAsync<SessionRow>(
        `SELECT * FROM draw_sessions WHERE project_id = ? AND status = 'completed'
         ORDER BY completed_at DESC, id DESC LIMIT 1`,
        [projectId],
      );
      return row ? mapSession(row) : null;
    },

    async updateRules(id: number, rules: DrawRules, now: number): Promise<void> {
      await db.runAsync(
        `UPDATE draw_sessions
           SET requested_winner_count = ?, allow_repeat_winners = ?, remove_selected_winners = ?,
               updated_at = ?
         WHERE id = ? AND status = 'active'`,
        [
          rules.requestedWinnerCount,
          rules.allowRepeatWinners ? 1 : 0,
          rules.removeSelectedWinners ? 1 : 0,
          now,
          id,
        ],
      );
    },

    async updateProjectName(id: number, name: string): Promise<void> {
      await db.runAsync(`UPDATE draw_sessions SET project_name = ? WHERE id = ? AND status = 'active'`, [
        name,
        id,
      ]);
    },

    async markCompleted(id: number, now: number): Promise<void> {
      await db.runAsync(
        `UPDATE draw_sessions SET status = 'completed', completed_at = ?, updated_at = ?
         WHERE id = ? AND status = 'active'`,
        [now, now, id],
      );
    },

    /** Deletes a session with its snapshot and winners (explicit, does not rely on FK cascades). */
    async deleteSession(id: number): Promise<void> {
      await db.runAsync(`DELETE FROM draw_winners WHERE draw_session_id = ?`, [id]);
      await db.runAsync(`DELETE FROM draw_participants WHERE draw_session_id = ?`, [id]);
      await db.runAsync(`DELETE FROM draw_sessions WHERE id = ?`, [id]);
    },

    async deleteActiveSessionsForProject(projectId: number): Promise<void> {
      const rows = await db.getAllAsync<{ id: number }>(
        `SELECT id FROM draw_sessions WHERE project_id = ? AND status = 'active'`,
        [projectId],
      );
      for (const { id } of rows) await this.deleteSession(id);
    },

    async detachProject(projectId: number): Promise<void> {
      await db.runAsync(`UPDATE draw_sessions SET project_id = NULL WHERE project_id = ?`, [projectId]);
    },

    // ---- roster snapshot -------------------------------------------------------------------

    async insertSnapshot(sessionId: number, items: readonly SnapshotInput[]): Promise<void> {
      let position = 0;
      for (const group of chunk(items, SNAPSHOT_CHUNK)) {
        const values: (string | number | null)[] = [];
        const tuples = group.map((item) => {
          values.push(sessionId, item.sourceParticipantId, item.displayName, position++);
          return '(?, ?, ?, ?)';
        });
        await db.runAsync(
          `INSERT INTO draw_participants (draw_session_id, source_participant_id, display_name, position)
           VALUES ${tuples.join(', ')}`,
          values,
        );
      }
    },

    async listSnapshot(sessionId: number): Promise<DrawParticipant[]> {
      const rows = await db.getAllAsync<DrawParticipantRow>(
        `SELECT * FROM draw_participants WHERE draw_session_id = ? ORDER BY position ASC, id ASC`,
        [sessionId],
      );
      return rows.map(mapDrawParticipant);
    },

    async countSnapshot(sessionId: number): Promise<number> {
      const row = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) AS c FROM draw_participants WHERE draw_session_id = ?`,
        [sessionId],
      );
      return row?.c ?? 0;
    },

    async clearSnapshotAndWinners(sessionId: number): Promise<void> {
      await db.runAsync(`DELETE FROM draw_winners WHERE draw_session_id = ?`, [sessionId]);
      await db.runAsync(`DELETE FROM draw_participants WHERE draw_session_id = ?`, [sessionId]);
    },

    // ---- winners ---------------------------------------------------------------------------

    async insertWinner(input: {
      sessionId: number;
      drawParticipantId: number;
      order: number;
      now: number;
    }): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO draw_winners (draw_session_id, draw_participant_id, winner_order, selected_at, revealed_at)
         VALUES (?, ?, ?, ?, NULL)`,
        [input.sessionId, input.drawParticipantId, input.order, input.now],
      );
      return result.lastInsertRowId;
    },

    async listWinners(sessionId: number): Promise<DrawWinnerWithName[]> {
      const rows = await db.getAllAsync<WinnerRow>(
        `SELECT w.*, dp.display_name AS display_name
         FROM draw_winners w
         JOIN draw_participants dp ON dp.id = w.draw_participant_id
         WHERE w.draw_session_id = ?
         ORDER BY w.winner_order ASC`,
        [sessionId],
      );
      return rows.map((r) => ({ ...mapWinner(r), displayName: r.display_name ?? '' }));
    },

    async markRevealed(winnerId: number, now: number): Promise<void> {
      await db.runAsync(
        `UPDATE draw_winners SET revealed_at = COALESCE(revealed_at, ?) WHERE id = ?`,
        [now, winnerId],
      );
    },

    async markAllRevealed(sessionId: number, now: number): Promise<void> {
      await db.runAsync(
        `UPDATE draw_winners SET revealed_at = ? WHERE draw_session_id = ? AND revealed_at IS NULL`,
        [now, sessionId],
      );
    },
  };
}

export type DrawRepository = ReturnType<typeof createDrawRepository>;
