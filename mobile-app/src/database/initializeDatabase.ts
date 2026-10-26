import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { DatabaseError, type Database, type RunResult, type SqlExecutor, type SqlValue } from './types';

export const DATABASE_NAME = 'pickzy.db';

type ExpoExecutor = Pick<
  SQLite.SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync'
>;

function wrapExecutor(ex: ExpoExecutor): SqlExecutor {
  return {
    execAsync: (sql) => ex.execAsync(sql),
    async runAsync(sql, params = []): Promise<RunResult> {
      const result = await ex.runAsync(sql, params as SqlValue[]);
      return { lastInsertRowId: Number(result.lastInsertRowId), changes: result.changes };
    },
    getAllAsync: <T>(sql: string, params: readonly SqlValue[] = []) =>
      ex.getAllAsync<T>(sql, params as SqlValue[]),
    getFirstAsync: <T>(sql: string, params: readonly SqlValue[] = []) =>
      ex.getFirstAsync<T>(sql, params as SqlValue[]),
  };
}

/** Adapts an `expo-sqlite` connection to the app's {@link Database} interface. */
export function createExpoDatabase(expoDb: SQLite.SQLiteDatabase): Database {
  return {
    ...wrapExecutor(expoDb),
    async transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
      let result: T | undefined;
      // Exclusive transactions use their own connection: no other query can interleave and a
      // thrown error rolls the whole transaction back.
      await expoDb.withExclusiveTransactionAsync(async (txn) => {
        result = await fn(wrapExecutor(txn));
      });
      return result as T;
    },
  };
}

let databasePromise: Promise<Database> | null = null;

async function open(): Promise<Database> {
  let expoDb: SQLite.SQLiteDatabase;
  try {
    expoDb = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await expoDb.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  } catch (cause) {
    throw new DatabaseError('OPEN_FAILED', 'The local database could not be opened', { cause });
  }
  const db = createExpoDatabase(expoDb);
  await runMigrations(db);
  return db;
}

/** Opens the on-device database once and runs pending migrations. Safe to call repeatedly. */
export function initializeDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = open().catch((error) => {
      databasePromise = null; // allow "Try again" in the UI
      throw error;
    });
  }
  return databasePromise;
}

/** Test seam: lets tests (or tooling) install a ready database. */
export function setDatabaseForTesting(db: Database | null): void {
  databasePromise = db ? Promise.resolve(db) : null;
}
