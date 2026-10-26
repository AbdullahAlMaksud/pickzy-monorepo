import type { Database } from '@/database/types';
import { createParticipantService } from '@/features/participants/services/participantService';
import { createProjectService } from '@/features/projects/services/projectService';
import { createHistoryService } from '@/features/history/services/historyService';
import { createPreferencesService } from '@/features/profile/services/preferencesService';
import { createDrawSessionService } from '@/features/wheel/services/drawSessionService';
import type { Rng } from '@/features/wheel/services/winnerSelection';

export interface Services {
  db: Database;
  projects: ReturnType<typeof createProjectService>;
  participants: ReturnType<typeof createParticipantService>;
  draws: ReturnType<typeof createDrawSessionService>;
  history: ReturnType<typeof createHistoryService>;
  preferences: ReturnType<typeof createPreferencesService>;
}

export function createServices(db: Database, options: { clock?: () => number; rng?: Rng } = {}): Services {
  return {
    db,
    projects: createProjectService(db, options.clock),
    participants: createParticipantService(db, options.clock),
    draws: createDrawSessionService(db, options),
    history: createHistoryService(db),
    preferences: createPreferencesService(db, options.clock),
  };
}
