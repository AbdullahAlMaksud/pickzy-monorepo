'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ListSkeleton } from '@/components/shared/ListSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HistoryOrder } from '@/lib/db/repositories/historyRepository';
import { useHistoryList } from '../hooks/useHistoryList';
import { HistoryItem } from './HistoryItem';

const ORDERS: readonly HistoryOrder[] = ['newest', 'oldest'];

export function HistoryScreen() {
  const { t } = useTranslation(['history', 'common']);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<HistoryOrder>('newest');
  const { data, loading, error, reload, hasMore, loadMore } = useHistoryList(search.trim(), order);
  const searching = search.trim().length > 0;

  return (
    <>
      <PageHeader title={t('title')} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder={t('search')} className="flex-1 sm:max-w-md" testId="history-search" />
        <Select value={order} onValueChange={(v) => setOrder(v as HistoryOrder)}>
          <SelectTrigger className="w-full sm:w-44" aria-label={t('sort.label')} data-testid="history-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDERS.map((o) => (
              <SelectItem key={o} value={o}>
                {t(`sort.${o}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && !data ? (
        <ErrorState onRetry={reload} />
      ) : loading && !data ? (
        <ListSkeleton />
      ) : data && data.length === 0 ? (
        searching ? (
          <p className="py-10 text-center text-muted-foreground">{t('noResults')}</p>
        ) : (
          <EmptyState
            icon={Clock}
            title={t('empty.title')}
            message={t('empty.message')}
            action={
              <Button asChild>
                <Link href="/projects/new">{t('empty.action')}</Link>
              </Button>
            }
          />
        )
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2" data-testid="history-list">
            {data?.map((item, i) => (
              <li key={item.id}>
                <HistoryItem item={item} colorIndex={i} />
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={loadMore} data-testid="history-load-more">
                {t('loadMore')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
