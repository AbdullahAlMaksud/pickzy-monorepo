import type { PickzyDatabase } from './database';

/** Runs `work` in one read/write transaction over all data tables (atomic: all or nothing). */
export function inTransaction<T>(db: PickzyDatabase, work: () => Promise<T>): Promise<T> {
  return db.transaction('rw', [...db.dataTables], work);
}
