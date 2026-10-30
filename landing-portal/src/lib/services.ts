import type { PickzyDatabase } from '@/lib/db/database';
import { createHistoryService } from '@/features/history/services/historyService';
import { createParticipantService } from '@/features/participants/services/participantService';
import { createPreferencesService } from '@/features/profile/services/preferencesService';
import { createProjectService } from '@/features/projects/services/projectService';
import { createDrawSessionService } from '@/features/wheel/services/drawSessionService';
import type { Rng } from '@/features/wheel/services/winnerSelection';

export interface Services {
  db: PickzyDatabase;
  projects: ReturnType<typeof createProjectService>;
  participants: ReturnType<typeof createParticipantService>;
  draws: ReturnType<typeof createDrawSessionService>;
  history: ReturnType<typeof createHistoryService>;
  preferences: ReturnType<typeof createPreferencesService>;
}

/** Composition root: builds every service over one database. Tests inject a clock and an rng. */
export function createServices(db: PickzyDatabase, options: { clock?: () => number; rng?: Rng } = {}): Services {
  return {
    db,
    projects: createProjectService(db, options.clock),
    participants: createParticipantService(db, options.clock),
    draws: createDrawSessionService(db, options),
    history: createHistoryService(db),
    preferences: createPreferencesService(db),
  };
}
