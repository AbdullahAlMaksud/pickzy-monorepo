'use client';

import { ArrowRight, CircleCheck, Crown, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from '@/hooks/useLocale';
import { useAppStore } from '@/store/appStore';
import { wheelPalette } from '../constants';

interface WinnerDialogProps {
  open: boolean;
  winnerName: string;
  projectName: string;
  /** 1-based place of this winner. */
  order: number;
  /** The planned number of winners has been reached. */
  isLast: boolean;
  /** Someone can still be drawn for the next place (the draw can be extended). */
  canContinue: boolean;
  /** The winner leaves the wheel for the following spins. */
  removedFromWheel: boolean;
  busy: boolean;
  /** Changes for every winner so the confetti restarts. */
  burstKey: number;
  onNext: () => void;
  onFinish: () => void;
  /** Dismissed without choosing: the result is already saved, the person stays on the wheel. */
  onClose: () => void;
}

async function fireConfetti() {
  try {
    const { default: confetti } = await import('canvas-confetti');
    const colors = [...wheelPalette];
    const shoot = (originX: number, angle: number) =>
      confetti({ particleCount: 60, spread: 70, startVelocity: 48, angle, origin: { x: originX, y: 0.75 }, colors, zIndex: 100, disableForReducedMotion: true });
    shoot(0.1, 60);
    shoot(0.9, 120);
    setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { x: 0.5, y: 0.35 }, colors, zIndex: 100, disableForReducedMotion: true }), 250);
  } catch {
    // Confetti is decoration only (no canvas support, blocked…): ignore.
  }
}

export function WinnerDialog({
  open,
  winnerName,
  projectName,
  order,
  isLast,
  canContinue,
  removedFromWheel,
  busy,
  burstKey,
  onNext,
  onFinish,
  onClose,
}: WinnerDialogProps) {
  const { t } = useTranslation(['wheel', 'common']);
  const { ordinal } = useLocale();
  const confettiEnabled = useAppStore((s) => s.preferences.confetti);
  const place = ordinal(order);

  useEffect(() => {
    if (open && confettiEnabled) void fireConfetti();
  }, [open, burstKey, confettiEnabled]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md" closeLabel={t('wheel:modal.close')} data-testid="winner-modal">
        <DialogHeader className="items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-gold/20 text-gold">
            <Crown className="size-8" aria-hidden />
          </div>
          <DialogTitle className="text-2xl" data-testid="winner-heading">
            {t('wheel:modal.heading')}
          </DialogTitle>
          <DialogDescription className="sr-only">{t('wheel:modal.announce', { name: winnerName, place })}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 text-center">
          <PersonAvatar name={winnerName} colorIndex={order - 1} className="size-[72px] text-2xl" />
          <p className="text-3xl font-bold break-words" data-testid="winner-name">
            {winnerName}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="gap-1 text-success">
              <CircleCheck aria-hidden />
              {t('wheel:modal.saved')}
            </Badge>
            <Badge variant="secondary" data-testid="winner-place">
              {t('wheel:modal.winnerNumber', { place })}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t('wheel:modal.project', { name: projectName })}</p>
          {canContinue && removedFromWheel ? <p className="text-sm text-muted-foreground">{t('wheel:modal.keepNote', { name: winnerName })}</p> : null}
        </div>

        <div className="grid gap-2">
          {canContinue ? (
            <Button size="lg" onClick={onNext} disabled={busy} data-testid="winner-next">
              {t('wheel:modal.next', { place: ordinal(order + 1) })}
              <ArrowRight className="rtl:rotate-180" aria-hidden />
            </Button>
          ) : null}
          {isLast || !canContinue ? (
            <Button size="lg" variant={canContinue ? 'secondary' : 'default'} onClick={onFinish} disabled={busy} data-testid="winner-finish">
              <Trophy aria-hidden />
              {t('wheel:modal.finish')}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={busy} data-testid="winner-close">
            {t('wheel:modal.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
