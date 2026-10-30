'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation('common');
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <TriangleAlert className="size-8 text-destructive" aria-hidden />
      <p>{message ?? t('errors.loadFailed')}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          {t('tryAgain')}
        </Button>
      ) : null}
    </div>
  );
}
