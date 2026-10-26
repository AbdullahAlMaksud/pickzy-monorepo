import type { Database } from '@/database/types';
import { createDrawRepository } from '@/database/repositories/drawRepository';
import { createParticipantRepository } from '@/database/repositories/participantRepository';
import {
  createProjectRepository,
  type HomeStats,
  type Project,
  type ProjectSummary,
} from '@/database/repositories/projectRepository';
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

export function createProjectService(db: Database, clock: () => number = Date.now) {
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

      return db.transaction(async (tx) => {
        const id = await createProjectRepository(tx).insert({ name, description, now });
        await createParticipantRepository(tx).appendMany(id, names, now);
        return id;
      });
    },

    async updateProject(id: number, input: { name: string; description: string }): Promise<void> {
      const errors = validateProject(input);
      if (hasErrors(errors)) throw new ProjectValidationError(errors);
      const { name, description } = normalizeProjectInput(input);
      await db.transaction(async (tx) => {
        await createProjectRepository(tx).update(id, { name, description, now: clock() });
      });
    },

    /**
     * Deletes a project and its participants. Completed draws stay in History (their snapshot keeps
     * the project name and roster); an unfinished draw is discarded.
     */
    async deleteProject(id: number): Promise<void> {
      await db.transaction(async (tx) => {
        const draws = createDrawRepository(tx);
        await draws.deleteActiveSessionsForProject(id);
        await draws.detachProject(id);
        await createParticipantRepository(tx).deleteAll(id);
        await createProjectRepository(tx).delete(id);
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
