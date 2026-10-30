import type { Participant } from '@/features/participants/types';
import type { PickzyDatabase } from '../database';

export function createParticipantRepository(db: PickzyDatabase) {
  async function listByProject(projectId: number): Promise<Participant[]> {
    return db.participants.where('projectId').equals(projectId).sortBy('position');
  }

  return {
    listByProject,

    count(projectId: number): Promise<number> {
      return db.participants.where('projectId').equals(projectId).count();
    },

    /** Appends names after the current last position. Returns how many were inserted. */
    async appendMany(projectId: number, names: readonly string[], now: number): Promise<number> {
      if (names.length === 0) return 0;
      const existing = await listByProject(projectId);
      let position = existing.length > 0 ? existing[existing.length - 1].position + 1 : 0;
      await db.participants.bulkAdd(
        names.map(
          (displayName) =>
            ({ projectId, displayName, position: position++, createdAt: now, updatedAt: now }) as Participant,
        ),
      );
      return names.length;
    },

    async rename(id: number, displayName: string, now: number): Promise<void> {
      await db.participants.update(id, { displayName, updatedAt: now });
    },

    /** Deletes the given participants (only those that belong to the project). */
    async deleteByIds(projectId: number, ids: readonly number[]): Promise<number> {
      const owned = (await db.participants.bulkGet([...ids]))
        .filter((p): p is Participant => !!p && p.projectId === projectId)
        .map((p) => p.id);
      await db.participants.bulkDelete(owned);
      return owned.length;
    },

    async deleteAll(projectId: number): Promise<number> {
      return db.participants.where('projectId').equals(projectId).delete();
    },

    /** Renumbers positions to 0..n-1 without gaps, keeping the current order. */
    async compactPositions(projectId: number): Promise<void> {
      const list = await listByProject(projectId);
      await Promise.all(
        list.map((p, index) => (p.position === index ? null : db.participants.update(p.id, { position: index }))),
      );
    },

    /** Applies a full ordering. Ids not in `orderedIds` keep their relative order after the others. */
    async applyOrder(projectId: number, orderedIds: readonly number[], now: number): Promise<void> {
      const list = await listByProject(projectId);
      const rank = new Map(orderedIds.map((id, i) => [id, i]));
      const ordered = [...list].sort(
        (a, b) => (rank.get(a.id) ?? orderedIds.length + a.position) - (rank.get(b.id) ?? orderedIds.length + b.position),
      );
      await Promise.all(ordered.map((p, index) => db.participants.update(p.id, { position: index, updatedAt: now })));
    },
  };
}
