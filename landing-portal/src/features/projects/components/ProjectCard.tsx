'use client';

import Link from 'next/link';
import { ChevronRight, Trophy, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { useLocale } from '@/hooks/useLocale';
import type { ProjectSummary } from '@/lib/db/repositories/projectRepository';

/** One project in a list: name, size, last activity and last winner. The whole card is a link. */
export function ProjectCard({ project }: { project: ProjectSummary }) {
  const { t } = useTranslation(['common', 'home']);
  const { relativeDate } = useLocale();
  return (
    <Link
      href={`/projects/${project.id}`}
      aria-label={t('home:project.open', { name: project.name })}
      className="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      data-testid={`project-card-${project.id}`}
    >
      <Card className="flex-row items-center gap-4 p-4 transition-colors group-hover:border-primary/50">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Users className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{project.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {t('common:participants', { count: project.participantCount })} · {t('home:project.updated', { date: relativeDate(project.updatedAt) })}
          </p>
          {project.lastWinnerName ? (
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Trophy className="size-3 text-gold" aria-hidden />
              {t('home:project.lastWinner', { name: project.lastWinnerName })}
            </p>
          ) : null}
        </div>
        <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" aria-hidden />
      </Card>
    </Link>
  );
}
