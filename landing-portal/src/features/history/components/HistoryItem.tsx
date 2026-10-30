'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Card } from '@/components/ui/card';
import { useLocale } from '@/hooks/useLocale';
import type { HistoryListItem } from '@/lib/db/repositories/historyRepository';

const NAME_PREVIEW = 2;

interface HistoryItemProps {
  item: HistoryListItem;
  colorIndex: number;
}

/** One finished draw in the list: project, date, the first winners and counts. The whole card is a link. */
export function HistoryItem({ item, colorIndex }: HistoryItemProps) {
  const { t } = useTranslation(['history', 'common']);
  const { dateTime } = useLocale();
  const shown = item.winnerNames.slice(0, NAME_PREVIEW);
  const extra = item.winnerNames.length - shown.length;
  const names = shown.join(', ');
  const winnerLine = `${item.winnerNames.length === 1 ? t('item.winner', { names }) : t('item.winners', { names })}${
    extra > 0 ? ` ${t('item.more', { count: extra })}` : ''
  }`;

  return (
    <Link
      href={`/history/${item.id}`}
      aria-label={t('item.open', { name: item.projectName })}
      className="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      data-testid={`history-${item.id}`}
    >
      <Card className="flex-row items-center gap-4 p-4 transition-colors group-hover:border-primary/50">
        <PersonAvatar name={item.projectName} colorIndex={colorIndex} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.projectName}</p>
          <p className="truncate text-sm text-muted-foreground">{dateTime(item.completedAt)}</p>
          <p className="line-clamp-2 text-sm font-medium text-primary">{winnerLine}</p>
        </div>
        <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
          <p>{t('common:participants', { count: item.participantCount })}</p>
          <p>{t('common:winners', { count: item.winnerCount })}</p>
        </div>
        <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" aria-hidden />
      </Card>
    </Link>
  );
}
