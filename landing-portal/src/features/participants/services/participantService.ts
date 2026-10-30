import type { PickzyDatabase } from '@/lib/db/database';
import { inTransaction } from '@/lib/db/transaction';
import { createParticipantRepository } from '@/lib/db/repositories/participantRepository';
import { createProjectRepository } from '@/lib/db/repositories/projectRepository';
import type { DuplicatePolicy, NameBatchResult, Participant } from '../types';
import {
  applyDuplicatePolicy,
  clampName,
  normalizeName,
  splitMultilineNames,
} from './participantNormalization';

export class ParticipantError extends Error {
  readonly code: 'EMPTY_NAME' | 'NOT_FOUND';
  constructor(code: ParticipantError['code']) {
    super(code);
    this.name = 'ParticipantError';
    this.code = code;
  }
}

export interface AddResult extends NameBatchResult {
  inserted: number;
}

/** Moves one id up/down in an ordered id list (pure, used by drafts and persisted lists). */
export function moveId(ids: readonly number[], id: number, direction: 'up' | 'down'): number[] {
  const next = [...ids];
  const from = next.indexOf(id);
  if (from < 0) return next;
  const to = direction === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= next.length) return next;
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function createParticipantService(db: PickzyDatabase, clock: () => number = Date.now) {
  return {
    list(projectId: number): Promise<Participant[]> {
      return createParticipantRepository(db).listByProject(projectId);
    },

    /** Adds names (already split, one per entry) using the chosen duplicate policy. */
    async addNames(
      projectId: number,
      rawNames: readonly string[],
      policy: DuplicatePolicy,
    ): Promise<AddResult> {
      return inTransaction(db, async () => {
        const repo = createParticipantRepository(db);
        const existing = await repo.listByProject(projectId);
        const incoming: string[] = [];
        let blankSkipped = 0;
        for (const raw of rawNames) {
          const name = normalizeName(raw);
          if (name) incoming.push(name);
          else blankSkipped += 1;
        }
        const applied = applyDuplicatePolicy(
          existing.map((p) => p.displayName),
          incoming,
          policy,
        );
        const now = clock();
        const inserted = await repo.appendMany(projectId, applied.names, now);
        if (inserted > 0) await createProjectRepository(db).touch(projectId, now);
        return { ...applied, blankSkipped, inserted };
      });
    },

    /** Adds free text, one name per line. */
    addText(projectId: number, text: string, policy: DuplicatePolicy): Promise<AddResult> {
      const { names, blankSkipped } = splitMultilineNames(text);
      return this.addNames(projectId, names, policy).then((r) => ({
        ...r,
        blankSkipped: r.blankSkipped + blankSkipped,
      }));
    },

    /** Edits a participant's current name. Past draws keep their own snapshot and never change. */
    async rename(projectId: number, participantId: number, rawName: string): Promise<void> {
      const name = clampName(normalizeName(rawName)).name;
      if (!name) throw new ParticipantError('EMPTY_NAME');
      await inTransaction(db, async () => {
        const now = clock();
        await createParticipantRepository(db).rename(participantId, name, now);
        await createProjectRepository(db).touch(projectId, now);
      });
    },

    async remove(projectId: number, ids: readonly number[]): Promise<number> {
      if (ids.length === 0) return 0;
      return inTransaction(db, async () => {
        const repo = createParticipantRepository(db);
        const removed = await repo.deleteByIds(projectId, ids);
        await repo.compactPositions(projectId);
        await createProjectRepository(db).touch(projectId, clock());
        return removed;
      });
    },

    async clear(projectId: number): Promise<number> {
      return inTransaction(db, async () => {
        const removed = await createParticipantRepository(db).deleteAll(projectId);
        await createProjectRepository(db).touch(projectId, clock());
        return removed;
      });
    },

    async reorder(projectId: number, orderedIds: readonly number[]): Promise<void> {
      await inTransaction(db, async () => {
        const now = clock();
        await createParticipantRepository(db).applyOrder(projectId, orderedIds, now);
        await createProjectRepository(db).touch(projectId, now);
      });
    },

    async move(projectId: number, participantId: number, direction: 'up' | 'down'): Promise<void> {
      await inTransaction(db, async () => {
        const repo = createParticipantRepository(db);
        const list = await repo.listByProject(projectId);
        const ordered = moveId(
          list.map((p) => p.id),
          participantId,
          direction,
        );
        const now = clock();
        await repo.applyOrder(projectId, ordered, now);
        await createProjectRepository(db).touch(projectId, now);
      });
    },
  };
}

export type ParticipantService = ReturnType<typeof createParticipantService>;
