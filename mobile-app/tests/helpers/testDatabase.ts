import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { runMigrations } from '@/database/migrations';
import type { Migration } from '@/database/migrations/types';
import { DatabaseError, type Database, type RunResult, type SqlExecutor, type SqlValue } from '@/database/types';

/**
 * A real SQLite engine (sql.js, WebAssembly) behind the app's `Database` interface, so repositories,
 * migrations, transactions and rollback are tested against actual SQL, not mocks.
 */
export async function createTestDatabase(options: { migrate?: boolean; migrations?: readonly Migration[] } = {}) {
  const SQL = await initSqlJs();
  const raw: SqlJsDatabase = new SQL.Database();
  raw.run('PRAGMA foreign_keys = ON;');
  return wrap(raw, options);
}

/** Re-opens an exported database image (simulates closing and reopening the app). */
export async function reopenTestDatabase(image: Uint8Array) {
  const SQL = await initSqlJs();
  const raw = new SQL.Database(image);
  raw.run('PRAGMA foreign_keys = ON;');
  return wrap(raw, { migrate: true });
}

async function wrap(raw: SqlJsDatabase, options: { migrate?: boolean; migrations?: readonly Migration[] }) {
  const toParams = (p: readonly SqlValue[] = []) => [...p];
  const executor: SqlExecutor = {
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params): Promise<RunResult> {
      raw.run(sql, toParams(params));
      const id = raw.exec('SELECT last_insert_rowid() AS id');
      return { lastInsertRowId: Number(id[0].values[0][0]), changes: raw.getRowsModified() };
    },
    async getAllAsync<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]> {
      const stmt = raw.prepare(sql);
      try {
        stmt.bind(toParams(params));
        const rows: T[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject() as T);
        return rows;
      } finally {
        stmt.free();
      }
    },
    async getFirstAsync<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null> {
      const rows = await this.getAllAsync<T>(sql, params);
      return rows[0] ?? null;
    },
  };

  // Serialize transactions like expo-sqlite's exclusive transactions do.
  let queue: Promise<unknown> = Promise.resolve();
  const db: Database = {
    ...executor,
    transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
      const run = async () => {
        raw.run('BEGIN');
        try {
          const result = await fn(executor);
          raw.run('COMMIT');
          return result;
        } catch (error) {
          raw.run('ROLLBACK');
          throw error;
        }
      };
      const next = queue.then(run, run);
      queue = next.catch(() => undefined);
      return next;
    },
  };

  if (options.migrate !== false) await runMigrations(db, options.migrations);
  return { db, raw, export: () => raw.export() };
}

export type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;
export { DatabaseError };

/** Deterministic RNG that returns the given values in order (cycling). */
export function sequenceRng(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Small seeded PRNG (mulberry32) for statistical tests. */
export function seededRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
