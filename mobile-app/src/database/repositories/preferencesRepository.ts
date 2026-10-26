import type { SqlExecutor } from '../types';

export function createPreferencesRepository(db: SqlExecutor) {
  return {
    async getAll(): Promise<Record<string, string>> {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        `SELECT key, value FROM preferences`,
      );
      const out: Record<string, string> = {};
      for (const row of rows) out[row.key] = row.value;
      return out;
    },

    async get(key: string): Promise<string | null> {
      const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM preferences WHERE key = ?`,
        [key],
      );
      return row?.value ?? null;
    },

    async set(key: string, value: string, now: number): Promise<void> {
      await db.runAsync(
        `INSERT INTO preferences (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, value, now],
      );
    },

    async remove(key: string): Promise<void> {
      await db.runAsync(`DELETE FROM preferences WHERE key = ?`, [key]);
    },
  };
}

export type PreferencesRepository = ReturnType<typeof createPreferencesRepository>;
