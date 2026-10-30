'use client';

import { useAsyncQuery } from '@/hooks/useAsyncQuery';

export function useProjectList(options: { search?: string; limit?: number } = {}) {
  return useAsyncQuery((s) => s.projects.listProjects(options), [options.search ?? '', options.limit ?? 0]);
}

export function useProjectSummary(projectId: number) {
  return useAsyncQuery((s) => s.projects.getSummary(projectId), [projectId]);
}

export function useProjectParticipants(projectId: number) {
  return useAsyncQuery((s) => s.participants.list(projectId), [projectId]);
}

export function useHomeStats() {
  return useAsyncQuery((s) => s.projects.getStats(), []);
}
