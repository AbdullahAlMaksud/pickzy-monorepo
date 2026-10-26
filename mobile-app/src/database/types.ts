/** SQLite value types accepted as bound parameters. */
export type SqlValue = string | number | null;

export interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

/**
 * The tiny subset of the SQLite API the repositories need. `expo-sqlite` implements it in the app
 * (see `createExpoDatabase`) and `sql.js` implements it in the Jest suite, so repositories and
 * services can be tested against a real SQL engine without a device.
 */
export interface SqlExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: readonly SqlValue[]): Promise<RunResult>;
  getAllAsync<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
}

export interface Database extends SqlExecutor {
  /**
   * Runs `fn` in a transaction. Commits when `fn` resolves, rolls back when it throws.
   * Only use the `tx` argument inside `fn` (never the outer database object).
   */
  transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}

export class DatabaseError extends Error {
  readonly code: 'MIGRATION_FAILED' | 'NEWER_SCHEMA' | 'OPEN_FAILED' | 'QUERY_FAILED';
  constructor(code: DatabaseError['code'], message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DatabaseError';
    this.code = code;
  }
}
