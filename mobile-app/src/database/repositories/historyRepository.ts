import { chunk, escapeLike, placeholders } from '../transactions';
import type { SqlExecutor } from '../types';
import type { DrawSession, DrawStatus } from '@/features/wheel/types';

export type HistoryOrder = 'newest' | 'oldest';

export interface HistoryListItem {
  id: number;
  projectId: number | null;
  projectName: string;
  completedAt: number;
  startedAt: number;
  participantCount: number;
  winnerCount: number;
  requestedWinnerCount: number;
  /** Winner names in selection order. */
  winnerNames: string[];
}

interface HistoryRow {
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
  participant_count: number;
  winner_count: number;
}

export function createHistoryRepository(db: SqlExecutor) {
  return {
    async listCompleted(options: {
      search?: string;
      order?: HistoryOrder;
      limit?: number;
      offset?: number;
    }): Promise<HistoryListItem[]> {
      const params: (string | number)[] = [];
      let where = `WHERE s.status = 'completed'`;
      const search = options.search?.trim();
      if (search) {
        const like = `%${escapeLike(search)}%`;
        where += ` AND (s.project_name LIKE ? ESCAPE '\\' OR EXISTS (
            SELECT 1 FROM draw_winners w2
            JOIN draw_participants p2 ON p2.id = w2.draw_participant_id
            WHERE w2.draw_session_id = s.id AND p2.display_name LIKE ? ESCAPE '\\'))`;
        params.push(like, like);
      }
      const direction = options.order === 'oldest' ? 'ASC' : 'DESC';
      params.push(options.limit ?? 30, options.offset ?? 0);

      const rows = await db.getAllAsync<HistoryRow>(
        `SELECT s.*,
           (SELECT COUNT(*) FROM draw_participants p WHERE p.draw_session_id = s.id) AS participant_count,
           (SELECT COUNT(*) FROM draw_winners w WHERE w.draw_session_id = s.id) AS winner_count
         FROM draw_sessions s
         ${where}
         ORDER BY s.completed_at ${direction}, s.id ${direction}
         LIMIT ? OFFSET ?`,
        params,
      );
      if (rows.length === 0) return [];

      const winnersBySession = new Map<number, string[]>();
      for (const ids of chunk(
        rows.map((r) => r.id),
        500,
      )) {
        const winners = await db.getAllAsync<{ draw_session_id: number; display_name: string }>(
          `SELECT w.draw_session_id, p.display_name
           FROM draw_winners w JOIN draw_participants p ON p.id = w.draw_participant_id
           WHERE w.draw_session_id IN (${placeholders(ids.length)})
           ORDER BY w.draw_session_id, w.winner_order`,
          ids,
        );
        for (const w of winners) {
          const list = winnersBySession.get(w.draw_session_id) ?? [];
          list.push(w.display_name);
          winnersBySession.set(w.draw_session_id, list);
        }
      }

      return rows.map((r) => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.project_name,
        completedAt: r.completed_at ?? r.updated_at,
        startedAt: r.started_at,
        participantCount: r.participant_count,
        winnerCount: r.winner_count,
        requestedWinnerCount: r.requested_winner_count,
        winnerNames: winnersBySession.get(r.id) ?? [],
      }));
    },

    async countCompleted(): Promise<number> {
      const row = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) AS c FROM draw_sessions WHERE status = 'completed'`,
      );
      return row?.c ?? 0;
    },

    async getCompletedSession(id: number): Promise<DrawSession | null> {
      const row = await db.getFirstAsync<HistoryRow>(
        `SELECT s.*, 0 AS participant_count, 0 AS winner_count
         FROM draw_sessions s WHERE s.id = ? AND s.status = 'completed'`,
        [id],
      );
      if (!row) return null;
      return {
        id: row.id,
        projectId: row.project_id,
        projectName: row.project_name,
        status: row.status,
        requestedWinnerCount: row.requested_winner_count,
        allowRepeatWinners: row.allow_repeat_winners === 1,
        removeSelectedWinners: row.remove_selected_winners === 1,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },
  };
}

export type HistoryRepository = ReturnType<typeof createHistoryRepository>;
