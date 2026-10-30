import { notFound } from 'next/navigation';
import { ProjectDetailScreen } from '@/features/projects/components/ProjectDetailScreen';

export default async function ProjectPage({ params }: PageProps<'/projects/[projectId]'>) {
  const projectId = Number((await params).projectId);
  if (!Number.isInteger(projectId) || projectId < 1) notFound();
  return <ProjectDetailScreen projectId={projectId} />;
}
