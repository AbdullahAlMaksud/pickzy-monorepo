'use client';

import Link from 'next/link';
import { FolderOpen, FolderPlus, Plus, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionCard } from '@/components/shared/ActionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ListSkeleton } from '@/components/shared/ListSkeleton';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useLocale } from '@/hooks/useLocale';
import { dayPartOf } from '@/lib/format';
import { useAppStore } from '@/store/appStore';

const RECENT_LIMIT = 5;

export function HomeScreen() {
  const { t } = useTranslation(['home', 'common']);
  const { number } = useLocale();
  const profile = useAppStore((s) => s.preferences);
  const [now] = useState(() => Date.now());
  const { data, loading, error, reload } = useAsyncQuery(async (s) => ({
    stats: await s.projects.getStats(),
    recent: await s.projects.listProjects({ limit: RECENT_LIMIT }),
  }));

  const greetingWord = t(`home:greeting.${dayPartOf(now)}`);
  const greeting = profile.displayName
    ? t('home:greeting.withName', { greeting: greetingWord, name: profile.displayName })
    : t('home:greeting.withoutName', { greeting: greetingWord });

  return (
    <div className="grid gap-8">
      <section className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground" data-testid="home-greeting">
            {greeting}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{t('common:appName')}</h1>
          <p className="text-muted-foreground">{t('home:tagline')} 🎉</p>
        </div>
        <Link href="/profile" aria-label={t('home:openProfile')} data-testid="home-avatar">
          <PersonAvatar name={profile.displayName} imageUrl={profile.photoDataUrl} colorIndex={0} className="size-12" />
        </Link>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <ActionCard href="/projects/new" icon={Plus} title={t('home:create.title')} subtitle={t('home:create.subtitle')} highlighted testId="home-create" />
        <ActionCard href="/projects" icon={FolderOpen} title={t('home:myProjects.title')} subtitle={t('home:myProjects.subtitle')} testId="home-projects" />
      </section>

      {error && !data ? (
        <ErrorState onRetry={reload} />
      ) : loading && !data ? (
        <ListSkeleton />
      ) : data ? (
        <>
          <section className="grid grid-cols-3 gap-3" aria-label={t('home:stats.projects')}>
            <StatCard icon={FolderOpen} label={t('home:stats.projects')} value={number(data.stats.projects)} />
            <StatCard icon={Users} label={t('home:stats.participants')} value={number(data.stats.participants)} />
            <StatCard icon={Trophy} label={t('home:stats.winners')} value={number(data.stats.winners)} />
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('home:recent.title')}</h2>
              {data.recent.length > 0 ? (
                <Button asChild variant="link" size="sm">
                  <Link href="/projects">{t('home:recent.seeAll')}</Link>
                </Button>
              ) : null}
            </div>
            {data.recent.length === 0 ? (
              <EmptyState
                icon={FolderPlus}
                title={t('home:empty.title')}
                message={t('home:empty.message')}
                action={
                  <Button asChild>
                    <Link href="/projects/new">{t('home:empty.action')}</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {data.recent.map((project) => (
                  <li key={project.id}>
                    <ProjectCard project={project} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
