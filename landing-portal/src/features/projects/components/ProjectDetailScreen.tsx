'use client';

import { MoreVertical, Pencil, Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ListSkeleton } from '@/components/shared/ListSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ParticipantsManager } from '@/features/participants/components/ParticipantsManager';
import { useStartDraw } from '@/features/wheel/hooks/useStartDraw';
import { useLocale } from '@/hooks/useLocale';
import { useServices } from '@/lib/services-context';
import { notifyDataChanged } from '@/store/appStore';
import { useProjectSummary } from '../hooks/useProjects';
import { EditProjectDialog } from './EditProjectDialog';
import { FolderX } from 'lucide-react';

/** One project: its details, the people in it and the button that starts (or resumes) a draw. */
export function ProjectDetailScreen({ projectId }: { projectId: number }) {
  const { t } = useTranslation(['projects', 'common']);
  const { number } = useLocale();
  const router = useRouter();
  const { projects } = useServices();
  const { data: project, loading, error, reload } = useProjectSummary(projectId);
  const { start, starting } = useStartDraw(projectId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (error && !project) return <ErrorState onRetry={reload} />;
  if (loading && project === undefined) return <ListSkeleton rows={4} />;
  if (!project) {
    return <EmptyState icon={FolderX} title={t('manage.projectNotFound')} />;
  }

  const remove = async () => {
    try {
      await projects.deleteProject(projectId);
      notifyDataChanged();
      toast.success(t('manage.deleted'));
      router.replace('/projects');
    } catch {
      toast.error(t('common:errors.saveFailed'));
    }
  };

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description || t('common:participants', { count: project.participantCount })}
        backHref="/projects"
        backLabel={t('common:back')}
        actions={
          <>
            <Button size="lg" onClick={() => void start()} disabled={starting || project.participantCount === 0} data-testid="start-spinning">
              <Play aria-hidden />
              {t('manage.startSpinning')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t('common:edit')} data-testid="project-menu">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Pencil />
                  {t('manage.editProject')}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                  <Trash2 />
                  {t('manage.deleteProject')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
      {project.description ? (
        <p className="-mt-3 mb-6 text-sm text-muted-foreground">{t('common:participants', { count: project.participantCount })}</p>
      ) : null}
      <span className="sr-only">{number(project.participantCount)}</span>
      <ParticipantsManager projectId={projectId} />

      <EditProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('manage.deleteProjectTitle')}
        description={t('manage.deleteProjectMessage')}
        confirmLabel={t('manage.deleteProject')}
        destructive
        onConfirm={remove}
      />
    </>
  );
}
