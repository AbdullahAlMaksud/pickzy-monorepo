import type { Metadata } from 'next';
import { ProjectsListScreen } from '@/features/projects/components/ProjectsListScreen';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return <ProjectsListScreen />;
}
