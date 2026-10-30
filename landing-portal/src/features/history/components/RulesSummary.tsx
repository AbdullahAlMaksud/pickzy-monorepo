'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/hooks/useLocale';
import type { DrawRules } from '@/features/wheel/types';

/** The rules a draw ran with. History shows the values saved with the draw, never the current ones. */
export function RulesSummary({ session }: { session: DrawRules }) {
  const { t } = useTranslation('history');
  const { number } = useLocale();
  const rows: [string, string][] = [
    [t('detail.winnerCount'), number(session.requestedWinnerCount)],
    [t('detail.repeat'), session.allowRepeatWinners ? t('detail.repeatOn') : t('detail.repeatOff')],
    [t('detail.removed'), session.removeSelectedWinners ? t('detail.removedOn') : t('detail.removedOff')],
  ];
  return (
    <Card data-testid="rules-summary">
      <CardHeader>
        <CardTitle className="text-lg">{t('detail.rulesHeading')}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
