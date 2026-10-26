import { createDrawRepository } from '@/database/repositories/drawRepository';
import {
  createHistoryRepository,
  type HistoryListItem,
  type HistoryOrder,
} from '@/database/repositories/historyRepository';
import type { Database } from '@/database/types';
import type { DrawParticipant, DrawSession, DrawWinnerWithName } from '@/features/wheel/types';

export interface HistoryDetail {
  session: DrawSession;
  /** The roster exactly as it was when the draw started. */
  participants: DrawParticipant[];
  winners: DrawWinnerWithName[];
}

export const HISTORY_PAGE_SIZE = 30;

export function createHistoryService(db: Database) {
  return {
    list(options: {
      search?: string;
      order?: HistoryOrder;
      limit?: number;
      offset?: number;
    }): Promise<HistoryListItem[]> {
      return createHistoryRepository(db).listCompleted({ limit: HISTORY_PAGE_SIZE, ...options });
    },

    count(): Promise<number> {
      return createHistoryRepository(db).countCompleted();
    },

    /** Returns `null` when the record does not exist (deleted, or not a completed draw). */
    async getDetail(id: number): Promise<HistoryDetail | null> {
      const session = await createHistoryRepository(db).getCompletedSession(id);
      if (!session) return null;
      const draws = createDrawRepository(db);
      return {
        session,
        participants: await draws.listSnapshot(id),
        winners: await draws.listWinners(id),
      };
    },
  };
}

export type HistoryService = ReturnType<typeof createHistoryService>;
