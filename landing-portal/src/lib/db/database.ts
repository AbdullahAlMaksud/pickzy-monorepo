import Dexie, { type EntityTable } from 'dexie';
import type { Participant } from '@/features/participants/types';
import type { DrawParticipant, DrawSession, DrawWinner } from '@/features/wheel/types';

export interface ProjectRecord {
  id: number;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface PreferenceRecord {
  key: string;
  value: unknown;
}

/**
 * Pickzy's local, offline database (IndexedDB through Dexie).
 *
 * Schema notes:
 * - Completed draws keep their own snapshot (`drawParticipants`, `drawWinners`, `projectName`), so
 *   History never changes when a project is edited or deleted.
 * - `drawSessions.projectId` is nullable: it is cleared when the project is deleted.
 */
export class PickzyDatabase extends Dexie {
  projects!: EntityTable<ProjectRecord, 'id'>;
  participants!: EntityTable<Participant, 'id'>;
  drawSessions!: EntityTable<DrawSession, 'id'>;
  drawParticipants!: EntityTable<DrawParticipant, 'id'>;
  drawWinners!: EntityTable<DrawWinner, 'id'>;
  preferences!: EntityTable<PreferenceRecord, 'key'>;

  constructor(name = 'pickzy') {
    super(name);
    this.version(1).stores({
      projects: '++id, name, updatedAt',
      participants: '++id, projectId, [projectId+position]',
      drawSessions: '++id, projectId, status, completedAt',
      drawParticipants: '++id, drawSessionId',
      drawWinners: '++id, drawSessionId, [drawSessionId+winnerOrder]',
      preferences: 'key',
    });
  }

  /** Every table that a draw or project transaction can touch. */
  get dataTables() {
    return [
      this.projects,
      this.participants,
      this.drawSessions,
      this.drawParticipants,
      this.drawWinners,
    ] as const;
  }
}

let shared: PickzyDatabase | null = null;

/** The app-wide database (browser only). Tests create their own instances with fake-indexeddb. */
export function getDatabase(): PickzyDatabase {
  if (!shared) shared = new PickzyDatabase();
  return shared;
}
