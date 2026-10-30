'use client';

import Link from 'next/link';
import { Clock, Home, Plus, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ListSkeleton } from '@/components/shared/ListSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useLocale } from '@/hooks/useLocale';
import { useStartDraw } from '../hooks/useStartDraw';
import { WinnerCard } from './WinnerCard';

/** The page shown right after a draw is finished. The same data is kept in History. */
export function ResultScreen({ drawId }: { drawId: number }) {
  const { t } = useTranslation(['wheel', 'history']);
  const { dateTime, ordinal, number } = useLocale();
  const { data, loading, error, reload } = useAsyncQuery((s) => s.history.getDetail(drawId), [drawId]);

  if (error && !data) return <ErrorState onRetry={reload} />;
  if (loading && data === undefined) return <ListSkeleton rows={3} />;
  if (!data) return <EmptyState icon={Trophy} title={t('wheel:result.notFound')} />;

  const { session, winners } = data;
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader
        title={t('wheel:result.title')}
        description={`${session.projectName}${session.completedAt ? ` · ${dateTime(session.completedAt)}` : ''}`}
      />
      <section aria-labelledby="result-winners" className="grid gap-3">
        <h2 id="result-winners" className="text-lg font-semibold">
          {t('wheel:result.heading')}
        </h2>
        {winners.map((w, i) => (
          <WinnerCard key={w.id} name={w.displayName} positionLabel={t('wheel:result.winnerLabel', { place: ordinal(w.winnerOrder) })} colorIndex={i} testId={`result-winner-${w.winnerOrder}`} />
        ))}
      </section>
      <Card className="gap-2 p-4 text-sm">
        <p className="font-semibold">{t('wheel:result.rules')}</p>
        <p className="text-muted-foreground">
          {t('history:detail.winnerCount')}: {number(session.requestedWinnerCount)} · {t('history:detail.repeat')}:{' '}
          {session.allowRepeatWinners ? t('history:detail.repeatOn') : t('history:detail.repeatOff')}
        </p>
        {session.removeSelectedWinners ? (
          <p className="text-muted-foreground">
            {winners.length === 1 ? t('wheel:result.removedNoteOne') : t('wheel:result.removedNote', { count: winners.length })}
          </p>
        ) : null}
      </Card>
      <div className="grid gap-2 sm:grid-cols-3">
        <NewDrawButton projectId={session.projectId} />
        <Button asChild variant="outline">
          <Link href={`/history/${drawId}`}>
            <Clock aria-hidden />
            {t('wheel:result.viewHistory')}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home aria-hidden />
            {t('wheel:result.home')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function NewDrawButton({ projectId }: { projectId: number | null }) {
  const { t } = useTranslation('wheel');
  const { start, starting } = useStartDraw(projectId ?? 0);
  if (projectId === null) return null;
  return (
    <Button onClick={() => void start()} disabled={starting} data-testid="new-draw">
      <Plus aria-hidden />
      {t('result.newDraw')}
    </Button>
  );
}
