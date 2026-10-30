'use client';

import Link from 'next/link';
import { FolderPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ListSkeleton } from '@/components/shared/ListSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import { useProjectList } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';

export function ProjectsListScreen() {
  const { t } = useTranslation(['projects', 'home']);
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useProjectList({ search });
  const searching = search.trim().length > 0;

  return (
    <>
      <PageHeader
        title={t('list.title')}
        description={t('home:myProjects.subtitle')}
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus aria-hidden />
              {t('new.title')}
            </Link>
          </Button>
        }
      />
      <SearchInput value={search} onChange={setSearch} placeholder={t('list.search')} className="mb-4 max-w-md" testId="project-search" />
      {error && !data ? (
        <ErrorState onRetry={reload} />
      ) : loading && !data ? (
        <ListSkeleton />
      ) : data && data.length === 0 ? (
        searching ? (
          <p className="py-10 text-center text-muted-foreground">{t('list.emptySearch')}</p>
        ) : (
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
        )
      ) : (
        <ul className="grid gap-3 md:grid-cols-2" data-testid="project-list">
          {data?.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
