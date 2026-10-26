import { DatabaseError, type Database, type SqlExecutor } from '../types';
import { migration001 } from './001_initial';
import type { Migration } from './types';

/**
 * Migration strategy
 * - The schema version lives in SQLite's own `PRAGMA user_version`.
 * - To change the schema, append a new migration with `version = previous + 1`. NEVER edit or reorder
 *   a released migration, and never drop user data: add columns/tables, backfill, then (optionally)
 *   retire old structures in a later migration.
 * - Each migration and its version bump run in a single transaction, so a crash leaves the database
 *   either fully at the old version or fully at the new one.
 * - A database with a *newer* version than the app knows is never touched (prevents data loss when a
 *   user downgrades the app).
 */
export const MIGRATIONS: readonly Migration[] = [migration001];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function getSchemaVersion(db: SqlExecutor): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export async function runMigrations(
  db: Database,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<{ from: number; to: number }> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  sorted.forEach((m, i) => {
    if (i > 0 && m.version === sorted[i - 1].version) {
      throw new DatabaseError('MIGRATION_FAILED', `Duplicate migration version ${m.version}`);
    }
  });
  const latest = sorted.length ? sorted[sorted.length - 1].version : 0;

  const current = await getSchemaVersion(db);
  if (current > latest) {
    throw new DatabaseError(
      'NEWER_SCHEMA',
      `Database schema v${current} is newer than this app supports (v${latest}).`,
    );
  }

  for (const migration of sorted) {
    if (migration.version <= current) continue;
    try {
      await db.transaction(async (tx) => {
        for (const statement of migration.statements) await tx.execAsync(statement);
        // PRAGMA does not accept bound parameters; `version` is a trusted integer from code.
        await tx.execAsync(`PRAGMA user_version = ${Math.trunc(migration.version)}`);
      });
    } catch (cause) {
      throw new DatabaseError(
        'MIGRATION_FAILED',
        `Migration ${migration.version} (${migration.name}) failed`,
        { cause },
      );
    }
  }
  return { from: current, to: latest };
}
