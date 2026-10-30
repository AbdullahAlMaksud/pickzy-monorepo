'use client';

import Link from 'next/link';
import { Crown, Share2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ListSkeleton } from '@/components/shared/ListSkeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useLocale } from '@/hooks/useLocale';
import { shareText } from '@/lib/share';
import { RulesSummary } from './RulesSummary';

export function HistoryDetailScreen({ historyId }: { historyId: number }) {
  const { t } = useTranslation(['history', 'common']);
  const { dateTime, number, ordinal } = useLocale();
  const { data: detail, loading, error, reload } = useAsyncQuery((s) => s.history.getDetail(historyId), [historyId]);
  const winnerIds = useMemo(() => new Set((detail?.winners ?? []).map((w) => w.drawParticipantId)), [detail]);

  const header = <PageHeader title={t('detail.title')} backHref="/history" backLabel={t('title')} />;

  if (error && !detail) return <>{header}<ErrorState onRetry={reload} /></>;
  if (loading && detail === undefined) return <>{header}<ListSkeleton rows={4} /></>;
  if (!detail) {
    return (
      <>
        {header}
        <EmptyState
          icon={Crown}
          title={t('detail.notFound')}
          action={
            <Button asChild variant="secondary">
              <Link href="/history">{t('title')}</Link>
            </Button>
          }
        />
      </>
    );
  }

  const { session, winners, participants } = detail;
  const completed = dateTime(session.completedAt ?? session.updatedAt);

  const share = async () => {
    const winnersText = winners
      .map((w) => t('detail.shareWinnersLine', { place: ordinal(w.winnerOrder), name: w.displayName }))
      .join('\n');
    const outcome = await shareText(
      t('detail.shareMessage', { project: session.projectName, date: completed, winners: winnersText }),
      session.projectName,
    );
    if (outcome === 'copied') toast.success(t('detail.copied'));
    else if (outcome === 'unsupported') toast.error(t('detail.shareFailed'));
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader
        title={session.projectName}
        description={`${t('detail.completedAt')}: ${completed}`}
        backHref="/history"
        backLabel={t('title')}
        actions={
          <Button variant="outline" onClick={() => void share()} data-testid="history-share">
            <Share2 aria-hidden />
            {t('detail.share')}
          </Button>
        }
        className="mb-0"
      />
      <p className="-mt-3 text-sm text-muted-foreground">
        {t('detail.originalCount')}: {number(participants.length)}
        {session.projectId === null ? <span className="block text-warning">{t('detail.projectDeleted')}</span> : null}
      </p>

      <section aria-labelledby="history-winners" className="grid gap-3 rounded-xl bg-winner p-4 text-winner-foreground" data-testid="history-winners">
        <h2 id="history-winners" className="font-semibold">
          {winners.length === 1 ? t('detail.winner') : t('detail.winnersHeading')}
        </h2>
        {winners.map((w) => (
          <div key={w.id} className="flex items-center gap-3">
            <PersonAvatar name={w.displayName} colorIndex={w.winnerOrder - 1} className="size-10" />
            <div className="min-w-0 flex-1">
              <p className="text-xs opacity-80">{t('detail.order', { order: w.winnerOrder })}</p>
              <p className="truncate text-lg font-bold">{w.displayName}</p>
            </div>
            <Crown className="size-5 text-gold" aria-hidden />
          </div>
        ))}
      </section>

      <RulesSummary session={session} />

      <section aria-labelledby="history-participants" className="grid gap-3">
        <div>
          <h2 id="history-participants" className="text-lg font-semibold">
            {t('detail.participantsHeading', { count: participants.length })}
          </h2>
          <p className="text-sm text-muted-foreground">{t('detail.snapshotNote')}</p>
        </div>
        {participants.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">{t('detail.participantsEmpty')}</p>
        ) : (
          <Card className="gap-0 p-0">
            <ul>
              {participants.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0 [content-visibility:auto]">
                  <PersonAvatar name={p.displayName} colorIndex={i} className="size-8" />
                  <span className="min-w-0 flex-1 truncate">{p.displayName}</span>
                  {winnerIds.has(p.id) ? (
                    <Badge className="bg-winner text-winner-foreground">
                      <Crown aria-hidden />
                      {t('detail.winnerBadge')}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
