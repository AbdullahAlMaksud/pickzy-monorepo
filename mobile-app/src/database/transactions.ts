import type { Database, SqlExecutor } from './types';

/** Thin helper so services read `inTransaction(db, async (tx) => { ... })`. */
export function inTransaction<T>(db: Database, fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
  return db.transaction(fn);
}

/** Splits an array into chunks (used to stay below SQLite's bound-parameter limit). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** `?, ?, ?` placeholders for an IN (...) list. Values are always bound, never concatenated. */
export function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

/** Escapes `%`, `_` and `\` so user text is matched literally in `LIKE ? ESCAPE '\'`. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}
