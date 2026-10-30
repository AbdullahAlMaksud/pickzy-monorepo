import type { DrawSession } from '@/features/wheel/types';
import type { PickzyDatabase } from '../database';
import { createDrawRepository } from './drawRepository';

export type HistoryOrder = 'newest' | 'oldest';

export interface HistoryListItem {
  id: number;
  projectId: number | null;
  projectName: string;
  completedAt: number;
  startedAt: number;
  participantCount: number;
  winnerCount: number;
  requestedWinnerCount: number;
  /** Winner names in selection order. */
  winnerNames: string[];
}

export interface ListHistoryOptions {
  search?: string;
  order?: HistoryOrder;
  limit?: number;
  offset?: number;
}

export function createHistoryRepository(db: PickzyDatabase) {
  const draws = createDrawRepository(db);

  const completedSessions = async () =>
    (await db.drawSessions.where('status').equals('completed').toArray()) as (DrawSession & { completedAt: number })[];

  return {
    async listCompleted({ search, order = 'newest', limit, offset = 0 }: ListHistoryOptions = {}): Promise<HistoryListItem[]> {
      const sessions = (await completedSessions()).sort((a, b) =>
        order === 'newest' ? b.completedAt - a.completedAt : a.completedAt - b.completedAt,
      );
      const items = await Promise.all(
        sessions.map(async (s): Promise<HistoryListItem> => {
          const winners = await draws.listWinners(s.id);
          return {
            id: s.id,
            projectId: s.projectId,
            projectName: s.projectName,
            completedAt: s.completedAt,
            startedAt: s.startedAt,
            participantCount: await draws.countSnapshot(s.id),
            winnerCount: winners.length,
            requestedWinnerCount: s.requestedWinnerCount,
            winnerNames: winners.map((w) => w.displayName),
          };
        }),
      );
      const needle = search?.trim().toLowerCase();
      const filtered = needle
        ? items.filter(
            (i) =>
              i.projectName.toLowerCase().includes(needle) ||
              i.winnerNames.some((n) => n.toLowerCase().includes(needle)),
          )
        : items;
      return filtered.slice(offset, limit === undefined ? undefined : offset + limit);
    },

    countCompleted(): Promise<number> {
      return db.drawSessions.where('status').equals('completed').count();
    },

    async getCompletedSession(id: number): Promise<DrawSession | null> {
      const session = await db.drawSessions.get(id);
      return session && session.status === 'completed' ? session : null;
    },
  };
}
