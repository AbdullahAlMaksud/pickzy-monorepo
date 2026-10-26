import type { SqlExecutor } from '../types';
import { escapeLike } from '../transactions';

export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  archivedAt: number | null;
}

export interface ProjectSummary extends Project {
  participantCount: number;
  /** First winner of the project's most recent completed draw, if any. */
  lastWinnerName: string | null;
  completedDrawCount: number;
}

export interface HomeStats {
  projects: number;
  participants: number;
  winners: number;
}

interface ProjectRow {
  id: number;
  name: string;
  description: string;
  created_at: number;
  updated_at: number;
  archived_at: number | null;
}

interface SummaryRow extends ProjectRow {
  participant_count: number;
  last_winner_name: string | null;
  completed_draw_count: number;
}

const mapProject = (r: ProjectRow): Project => ({
  id: r.id,
  name: r.name,
  description: r.description,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  archivedAt: r.archived_at,
});

export function createProjectRepository(db: SqlExecutor) {
  return {
    async insert(input: { name: string; description: string; now: number }): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO projects (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        [input.name, input.description, input.now, input.now],
      );
      return result.lastInsertRowId;
    },

    async getById(id: number): Promise<Project | null> {
      const row = await db.getFirstAsync<ProjectRow>(`SELECT * FROM projects WHERE id = ?`, [id]);
      return row ? mapProject(row) : null;
    },

    async update(id: number, input: { name: string; description: string; now: number }) {
      await db.runAsync(`UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?`, [
        input.name,
        input.description,
        input.now,
        id,
      ]);
    },

    async touch(id: number, now: number) {
      await db.runAsync(`UPDATE projects SET updated_at = ? WHERE id = ?`, [now, id]);
    },

    async delete(id: number) {
      await db.runAsync(`DELETE FROM projects WHERE id = ?`, [id]);
    },

    /** Projects (newest activity first) with live participant counts and last winner. */
    async listSummaries(
      options: { search?: string; limit?: number; offset?: number } = {},
    ): Promise<ProjectSummary[]> {
      const params: (string | number)[] = [];
      let where = `WHERE pr.archived_at IS NULL`;
      const search = options.search?.trim();
      if (search) {
        where += ` AND pr.name LIKE ? ESCAPE '\\'`;
        params.push(`%${escapeLike(search)}%`);
      }
      params.push(options.limit ?? 500, options.offset ?? 0);
      const rows = await db.getAllAsync<SummaryRow>(
        `SELECT pr.*,
           (SELECT COUNT(*) FROM participants pa WHERE pa.project_id = pr.id) AS participant_count,
           (SELECT COUNT(*) FROM draw_sessions s
              WHERE s.project_id = pr.id AND s.status = 'completed') AS completed_draw_count,
           (SELECT dp.display_name
              FROM draw_winners w
              JOIN draw_sessions s ON s.id = w.draw_session_id
              JOIN draw_participants dp ON dp.id = w.draw_participant_id
              WHERE s.project_id = pr.id AND s.status = 'completed'
              ORDER BY s.completed_at DESC, w.winner_order ASC LIMIT 1) AS last_winner_name
         FROM projects pr
         ${where}
         ORDER BY pr.updated_at DESC, pr.id DESC
         LIMIT ? OFFSET ?`,
        params,
      );
      return rows.map((r) => ({
        ...mapProject(r),
        participantCount: r.participant_count,
        lastWinnerName: r.last_winner_name,
        completedDrawCount: r.completed_draw_count,
      }));
    },

    async getSummary(id: number): Promise<ProjectSummary | null> {
      const row = await db.getFirstAsync<SummaryRow>(
        `SELECT pr.*,
           (SELECT COUNT(*) FROM participants pa WHERE pa.project_id = pr.id) AS participant_count,
           (SELECT COUNT(*) FROM draw_sessions s
              WHERE s.project_id = pr.id AND s.status = 'completed') AS completed_draw_count,
           (SELECT dp.display_name
              FROM draw_winners w
              JOIN draw_sessions s ON s.id = w.draw_session_id
              JOIN draw_participants dp ON dp.id = w.draw_participant_id
              WHERE s.project_id = pr.id AND s.status = 'completed'
              ORDER BY s.completed_at DESC, w.winner_order ASC LIMIT 1) AS last_winner_name
         FROM projects pr WHERE pr.id = ?`,
        [id],
      );
      if (!row) return null;
      return {
        ...mapProject(row),
        participantCount: row.participant_count,
        lastWinnerName: row.last_winner_name,
        completedDrawCount: row.completed_draw_count,
      };
    },

    async stats(): Promise<HomeStats> {
      const projects = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) AS c FROM projects WHERE archived_at IS NULL`,
      );
      const participants = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) AS c FROM participants pa
           JOIN projects pr ON pr.id = pa.project_id WHERE pr.archived_at IS NULL`,
      );
      const winners = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) AS c FROM draw_winners w
           JOIN draw_sessions s ON s.id = w.draw_session_id WHERE s.status = 'completed'`,
      );
      return {
        projects: projects?.c ?? 0,
        participants: participants?.c ?? 0,
        winners: winners?.c ?? 0,
      };
    },
  };
}

export type ProjectRepository = ReturnType<typeof createProjectRepository>;
