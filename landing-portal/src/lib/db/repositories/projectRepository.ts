import type { PickzyDatabase, ProjectRecord } from '../database';

export type Project = ProjectRecord;

export interface ProjectSummary extends Project {
  participantCount: number;
  /** First winner of the project's most recent completed draw, if any. */
  lastWinnerName: string | null;
  completedDrawCount: number;
}

export interface HomeStats {
  projects: number;
  participants: number;
  winners: number;
}

export interface ListProjectsOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

export function createProjectRepository(db: PickzyDatabase) {
  async function summarize(project: Project): Promise<ProjectSummary> {
    const participantCount = await db.participants.where('projectId').equals(project.id).count();
    const completed = (await db.drawSessions.where('projectId').equals(project.id).toArray())
      .filter((s) => s.status === 'completed')
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    let lastWinnerName: string | null = null;
    if (completed[0]) {
      const first = await db.drawWinners
        .where('[drawSessionId+winnerOrder]')
        .between([completed[0].id, 0], [completed[0].id, Infinity])
        .first();
      if (first) lastWinnerName = (await db.drawParticipants.get(first.drawParticipantId))?.displayName ?? null;
    }
    return { ...project, participantCount, lastWinnerName, completedDrawCount: completed.length };
  }

  return {
    async insert(input: { name: string; description: string; now: number }): Promise<number> {
      return db.projects.add({
        name: input.name,
        description: input.description,
        createdAt: input.now,
        updatedAt: input.now,
      } as Project);
    },

    async update(id: number, input: { name: string; description: string; now: number }): Promise<void> {
      await db.projects.update(id, { name: input.name, description: input.description, updatedAt: input.now });
    },

    async touch(id: number, now: number): Promise<void> {
      await db.projects.update(id, { updatedAt: now });
    },

    async delete(id: number): Promise<void> {
      await db.projects.delete(id);
    },

    async getById(id: number): Promise<Project | null> {
      return (await db.projects.get(id)) ?? null;
    },

    async getSummary(id: number): Promise<ProjectSummary | null> {
      const project = await db.projects.get(id);
      return project ? summarize(project) : null;
    },

    async listSummaries({ search, limit, offset = 0 }: ListProjectsOptions = {}): Promise<ProjectSummary[]> {
      const needle = search?.trim().toLowerCase();
      let projects = await db.projects.orderBy('updatedAt').reverse().toArray();
      if (needle) {
        projects = projects.filter(
          (p) => p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle),
        );
      }
      projects = projects.slice(offset, limit === undefined ? undefined : offset + limit);
      return Promise.all(projects.map(summarize));
    },

    async stats(): Promise<HomeStats> {
      const [projects, participants, winners] = await Promise.all([
        db.projects.count(),
        db.participants.count(),
        db.drawSessions.where('status').equals('completed').toArray().then(async (sessions) => {
          const counts = await Promise.all(
            sessions.map((s) => db.drawWinners.where('drawSessionId').equals(s.id).count()),
          );
          return counts.reduce((a, b) => a + b, 0);
        }),
      ]);
      return { projects, participants, winners };
    },
  };
}
