import { chunk, placeholders } from '../transactions';
import type { SqlExecutor } from '../types';
import type { Participant } from '@/features/participants/types';

interface ParticipantRow {
  id: number;
  project_id: number;
  display_name: string;
  position: number;
  created_at: number;
  updated_at: number;
}

const mapParticipant = (r: ParticipantRow): Participant => ({
  id: r.id,
  projectId: r.project_id,
  displayName: r.display_name,
  position: r.position,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** 5 bound values per row; 150 rows = 750 < SQLite's default 999-variable limit. */
const INSERT_CHUNK = 150;
const IN_CHUNK = 500;

export function createParticipantRepository(db: SqlExecutor) {
  return {
    async listByProject(projectId: number): Promise<Participant[]> {
      const rows = await db.getAllAsync<ParticipantRow>(
        `SELECT * FROM participants WHERE project_id = ? ORDER BY position ASC, id ASC`,
        [projectId],
      );
      return rows.map(mapParticipant);
    },

    async count(projectId: number): Promise<number> {
      const row = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) AS c FROM participants WHERE project_id = ?`,
        [projectId],
      );
      return row?.c ?? 0;
    },

    /** Appends names after the current last position and returns how many were inserted. */
    async appendMany(projectId: number, names: readonly string[], now: number): Promise<number> {
      if (names.length === 0) return 0;
      const last = await db.getFirstAsync<{ m: number | null }>(
        `SELECT MAX(position) AS m FROM participants WHERE project_id = ?`,
        [projectId],
      );
      let position = (last?.m ?? -1) + 1;
      for (const group of chunk(names, INSERT_CHUNK)) {
        const values: (string | number)[] = [];
        const tuples = group.map((name) => {
          values.push(projectId, name, position++, now, now);
          return '(?, ?, ?, ?, ?)';
        });
        await db.runAsync(
          `INSERT INTO participants (project_id, display_name, position, created_at, updated_at)
           VALUES ${tuples.join(', ')}`,
          values,
        );
      }
      return names.length;
    },

    async rename(id: number, name: string, now: number): Promise<void> {
      await db.runAsync(`UPDATE participants SET display_name = ?, updated_at = ? WHERE id = ?`, [
        name,
        now,
        id,
      ]);
    },

    async deleteByIds(projectId: number, ids: readonly number[]): Promise<number> {
      let removed = 0;
      for (const group of chunk(ids, IN_CHUNK)) {
        const result = await db.runAsync(
          `DELETE FROM participants WHERE project_id = ? AND id IN (${placeholders(group.length)})`,
          [projectId, ...group],
        );
        removed += result.changes;
      }
      return removed;
    },

    async deleteAll(projectId: number): Promise<number> {
      const result = await db.runAsync(`DELETE FROM participants WHERE project_id = ?`, [projectId]);
      return result.changes;
    },

    /** Rewrites positions to 0..n-1 following `orderedIds`; ids not listed keep their relative order after. */
    async applyOrder(projectId: number, orderedIds: readonly number[], now: number): Promise<void> {
      for (const group of chunk(orderedIds.map((id, i) => [id, i] as const), 200)) {
        const cases = group.map(() => 'WHEN ? THEN ?').join(' ');
        const params: (string | number)[] = [];
        for (const [id, pos] of group) params.push(id, pos);
        const ids = group.map(([id]) => id);
        await db.runAsync(
          `UPDATE participants SET position = CASE id ${cases} END, updated_at = ?
           WHERE project_id = ? AND id IN (${placeholders(ids.length)})`,
          [...params, now, projectId, ...ids],
        );
      }
    },

    /** Closes gaps in `position` after deletions (keeps order). */
    async compactPositions(projectId: number): Promise<void> {
      const rows = await db.getAllAsync<{ id: number }>(
        `SELECT id FROM participants WHERE project_id = ? ORDER BY position ASC, id ASC`,
        [projectId],
      );
      await this.applyOrder(
        projectId,
        rows.map((r) => r.id),
        Date.now(),
      );
    },
  };
}

export type ParticipantRepository = ReturnType<typeof createParticipantRepository>;
