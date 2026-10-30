import type { PickzyDatabase } from '@/lib/db/database';
import { inTransaction } from '@/lib/db/transaction';
import { createDrawRepository } from '@/lib/db/repositories/drawRepository';
import { createParticipantRepository } from '@/lib/db/repositories/participantRepository';
import {
  createProjectRepository,
  type HomeStats,
  type Project,
  type ProjectSummary,
} from '@/lib/db/repositories/projectRepository';
import { clampName, normalizeName } from '@/features/participants/services/participantNormalization';
import { hasErrors, normalizeProjectInput, validateProject, type ProjectErrors } from '../validation';

export class ProjectValidationError extends Error {
  readonly errors: ProjectErrors;
  constructor(errors: ProjectErrors) {
    super('Invalid project');
    this.name = 'ProjectValidationError';
    this.errors = errors;
  }
}

export interface CreateProjectInput {
  name: string;
  description: string;
  participantNames: readonly string[];
}

export function createProjectService(db: PickzyDatabase, clock: () => number = Date.now) {
  return {
    /** Creates the project and all of its participants atomically. Returns the new project id. */
    async createProject(input: CreateProjectInput): Promise<number> {
      const names = input.participantNames
        .map((n) => clampName(normalizeName(n)).name)
        .filter((n) => n.length > 0);
      const errors = validateProject(input, names.length);
      if (hasErrors(errors)) throw new ProjectValidationError(errors);
      const { name, description } = normalizeProjectInput(input);
      const now = clock();

      return inTransaction(db, async () => {
        const id = await createProjectRepository(db).insert({ name, description, now });
        await createParticipantRepository(db).appendMany(id, names, now);
        return id;
      });
    },

    async updateProject(id: number, input: { name: string; description: string }): Promise<void> {
      const errors = validateProject(input);
      if (hasErrors(errors)) throw new ProjectValidationError(errors);
      const { name, description } = normalizeProjectInput(input);
      await createProjectRepository(db).update(id, { name, description, now: clock() });
    },

    /**
     * Deletes a project and its participants. Completed draws stay in History (their snapshot keeps
     * the project name and roster); an unfinished draw is discarded.
     */
    async deleteProject(id: number): Promise<void> {
      await inTransaction(db, async () => {
        const draws = createDrawRepository(db);
        await draws.deleteActiveSessionsForProject(id);
        await draws.detachProject(id);
        await createParticipantRepository(db).deleteAll(id);
        await createProjectRepository(db).delete(id);
      });
    },

    getProject(id: number): Promise<Project | null> {
      return createProjectRepository(db).getById(id);
    },

    getSummary(id: number): Promise<ProjectSummary | null> {
      return createProjectRepository(db).getSummary(id);
    },

    listProjects(options?: { search?: string; limit?: number; offset?: number }) {
      return createProjectRepository(db).listSummaries(options);
    },

    getStats(): Promise<HomeStats> {
      return createProjectRepository(db).stats();
    },
  };
}

export type ProjectService = ReturnType<typeof createProjectService>;
