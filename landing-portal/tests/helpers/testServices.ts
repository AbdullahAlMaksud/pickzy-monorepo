import { PickzyDatabase } from '@/lib/db/database';
import { createServices, type Services } from '@/lib/services';
import type { Rng } from '@/features/wheel/services/winnerSelection';
import { sequenceRng } from './rng';

let counter = 0;

export interface TestApp {
  db: PickzyDatabase;
  name: string;
  services: Services;
}

/** A fresh in-memory IndexedDB (fake-indexeddb) with the real services on top. */
export function createTestApp(options: { rng?: Rng; clock?: () => number; name?: string } = {}): TestApp {
  const name = options.name ?? `pickzy-test-${++counter}-${Math.random().toString(36).slice(2)}`;
  const db = new PickzyDatabase(name);
  return { db, name, services: createServices(db, { rng: options.rng ?? sequenceRng([0]), clock: options.clock }) };
}

/** Closes and re-opens the same database, as if the app was closed and started again. */
export async function reopenTestApp(app: TestApp, options: { rng?: Rng; clock?: () => number } = {}): Promise<TestApp> {
  app.db.close();
  const db = new PickzyDatabase(app.name);
  await db.open();
  return { db, name: app.name, services: createServices(db, { rng: options.rng ?? sequenceRng([0]), clock: options.clock }) };
}
