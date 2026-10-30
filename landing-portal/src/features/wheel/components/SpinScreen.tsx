'use client';

import Link from 'next/link';
import { ArrowRight, Settings, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ListSkeleton } from '@/components/shared/ListSkeleton';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { useLatest } from '@/hooks/useLatest';
import { useLocale } from '@/hooks/useLocale';
import { useServices } from '@/lib/services-context';
import { notifyDataChanged } from '@/store/appStore';
import { useDrawErrorMessage } from '../hooks/useDrawErrors';
import { useDrawSession } from '../hooks/useDrawSession';
import { useSpinController } from '../hooks/useSpinController';
import { computeLabelLayout } from '../services/wheelGeometry';
import { getDrawProgress, normalizeRules, winnersAreExcluded } from '../services/winnerSelection';
import { DrawSettingsSheet } from './DrawSettingsSheet';
import { SpinWheel, type SpinWheelHandle } from './SpinWheel';
import { WinnerCard } from './WinnerCard';
import { WinnerDialog } from './WinnerDialog';
import { Users } from 'lucide-react';

/** The wheel page: spin, reveal each winner, keep going for 2nd/3rd place, then finish the draw. */
export function SpinScreen({ drawId }: { drawId: number }) {
  const { t } = useTranslation(['wheel', 'common']);
  const { number, ordinal } = useLocale();
  const router = useRouter();
  const { draws } = useServices();
  const errorMessage = useDrawErrorMessage();
  const wheelRef = useRef<SpinWheelHandle>(null);
  const [finishing, setFinishing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { snapshot, loading, error, reload } = useDrawSession(drawId);
  const onError = useCallback((e: unknown) => toast.error(errorMessage(e)), [errorMessage]);
  const { phase, revealing, wheelItems, eligible, spin, acknowledge } = useSpinController({ drawId, snapshot, wheelRef, reload, onError });

  const latestSpin = useLatest(spin);

  const rules = snapshot ? normalizeRules(snapshot.session) : null;
  const winnerIds = snapshot?.winners.map((w) => w.drawParticipantId) ?? [];
  const progress = snapshot && rules ? getDrawProgress(snapshot.participants.length, winnerIds, rules) : null;
  const excludesWinners = !!rules && winnersAreExcluded(rules);

  const busy = phase !== 'idle';
  const done = snapshot?.winners.length ?? 0;
  const canSpin = !busy && !revealing && progress?.kind === 'ready' && wheelItems.length > 0;
  const canFinish = !busy && !revealing && done > 0 && (progress?.kind === 'complete' || progress?.kind === 'exhausted');
  const canPickMore = !busy && !revealing && done > 0 && progress?.kind === 'complete' && (excludesWinners ? eligible.length > 0 : true);
  // While a winner is on screen the snapshot is one result behind: the frozen wheel still holds them.
  const canContinueAfterReveal = excludesWinners ? wheelItems.length > 1 : true;

  const finishDraw = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      if (revealing) await draws.acknowledgeWinner(revealing.winner.id);
      await draws.finish(drawId);
      notifyDataChanged();
      router.replace(`/draw/${drawId}/result`);
    } catch (e) {
      toast.error(errorMessage(e));
      setFinishing(false);
    }
  }, [draws, drawId, errorMessage, finishing, revealing, router]);

  /** Raises the winner count by one so the draw can continue ("2nd place", "3rd place"…). */
  const addSlot = useCallback(async () => {
    try {
      await draws.addWinnerSlot(drawId);
      return true;
    } catch (e) {
      onError(e);
      return false;
    }
  }, [draws, drawId, onError]);

  const onNext = useCallback(async () => {
    try {
      if (revealing && revealing.order >= revealing.requested && !(await addSlot())) return;
      await acknowledge();
      // Wait for the dialog to close and the wheel to update, then call the spin of *that* render.
      setTimeout(() => void latestSpin.current(), 250);
    } catch (e) {
      onError(e);
    }
  }, [acknowledge, addSlot, latestSpin, onError, revealing]);

  const pickMore = useCallback(async () => {
    if (!(await addSlot())) return;
    reload();
    setTimeout(() => void latestSpin.current(), 250);
  }, [addSlot, latestSpin, reload]);

  if (loading && !snapshot) return <ListSkeleton rows={4} />;
  if (error || !snapshot || !rules) return <ErrorState onRetry={reload} />;

  const spinLabel = phase === 'spinning' || phase === 'selecting' ? t('spinning') : t('spin');
  const labelsHidden = wheelItems.length > 0 && !computeLabelLayout(wheelItems.length, 168).visible;
  const projectId = snapshot.session.projectId;

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl bg-stage p-4 text-stage-foreground shadow-lg sm:p-8" aria-label={t('title')}>
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{snapshot.session.projectName}</h1>
            <p className="text-sm text-stage-muted">{t('common:participants', { count: snapshot.participants.length })}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-stage-foreground hover:bg-stage-surface hover:text-stage-foreground"
            onClick={() => setSettingsOpen(true)}
            disabled={busy}
            aria-label={t('settings')}
            data-testid="open-draw-settings"
          >
            <Settings />
          </Button>
        </header>

        {progress?.kind === 'empty' ? (
          <EmptyState
            icon={Users}
            title={t('empty.title')}
            message={t('empty.message')}
            className="border-stage-muted/40 text-stage-foreground [&_p]:text-stage-muted"
            action={
              projectId !== null ? (
                <Button asChild variant="secondary">
                  <Link href={`/projects/${projectId}`}>{t('empty.action')}</Link>
                </Button>
              ) : null
            }
          />
        ) : progress?.kind === 'exhausted' && wheelItems.length === 0 ? (
          <div className="rounded-xl bg-stage-surface p-6 text-center">
            <p className="text-lg font-semibold">{t('noEligible.title')}</p>
            <p className="text-stage-muted">{t('noEligible.message')}</p>
          </div>
        ) : (
          <SpinWheel ref={wheelRef} items={wheelItems} spinLabel={spinLabel} spinDisabled={!canSpin} onSpinClick={() => void spin()} />
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="rounded-full bg-stage-surface px-3 py-1 font-semibold" data-testid="draw-progress">
            {t('progress', { done, total: rules.requestedWinnerCount })}
          </span>
          <span className="rounded-full bg-stage-surface px-3 py-1 text-stage-muted">{t('eligible', { count: wheelItems.length })}</span>
        </div>

        {progress?.kind === 'complete' ? (
          <div className="mt-4 rounded-xl bg-stage-surface p-4 text-center" role="alert">
            <p className="font-semibold">{t('complete.title')}</p>
            <p className="text-sm text-stage-muted">{t('complete.message')}</p>
          </div>
        ) : null}

        <div className="mx-auto mt-6 grid max-w-sm gap-3">
          {canPickMore ? (
            <Button size="lg" onClick={() => void pickMore()} data-testid="spin-more">
              {t('pickMore', { place: ordinal(done + 1) })}
              <ArrowRight className="rtl:rotate-180" aria-hidden />
            </Button>
          ) : null}
          {canFinish ? (
            <Button size="lg" variant={canPickMore ? 'secondary' : 'default'} onClick={() => void finishDraw()} disabled={finishing} data-testid="finish-draw">
              <Trophy aria-hidden />
              {finishing ? t('finishing') : t('finish')}
            </Button>
          ) : !canPickMore ? (
            <Button size="lg" onClick={() => void spin()} disabled={!canSpin} data-testid="spin-button" aria-describedby="spin-hint">
              {spinLabel}
            </Button>
          ) : null}
          <p id="spin-hint" className="sr-only">
            {t('spinButtonHint')}
          </p>
        </div>
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {phase === 'spinning' ? t('announceSpin') : ''}
      </p>

      <section className="grid gap-3" aria-labelledby="winners-heading">
        <h2 id="winners-heading" className="text-lg font-semibold">
          {t('winnersTitle')}
        </h2>
        {snapshot.winners.length === 0 ? (
          <p className="text-muted-foreground">{t('noWinnersYet')}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {snapshot.winners.map((w, i) => (
              <WinnerCard key={w.id} name={w.displayName} positionLabel={t('result.winnerLabel', { place: ordinal(w.winnerOrder) })} colorIndex={i} testId={`winner-card-${w.winnerOrder}`} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3" aria-labelledby="wheel-list-heading">
        <h2 id="wheel-list-heading" className="text-lg font-semibold">
          {t('participantsList')} ({number(wheelItems.length)})
        </h2>
        {labelsHidden ? <p className="text-sm text-muted-foreground">{t('tooManyLabels')}</p> : null}
        <ul className="grid max-h-96 gap-1 overflow-y-auto rounded-xl border p-2 sm:grid-cols-2" data-testid="wheel-list">
          {wheelItems.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 [content-visibility:auto]">
              <PersonAvatar name={item.displayName} colorIndex={i} className="size-8" />
              <span className="truncate">{item.displayName}</span>
            </li>
          ))}
        </ul>
      </section>

      <WinnerDialog
        open={!!revealing}
        winnerName={revealing?.winner.displayName ?? ''}
        projectName={snapshot.session.projectName}
        order={revealing?.order ?? 1}
        isLast={(revealing?.order ?? 0) >= (revealing?.requested ?? rules.requestedWinnerCount)}
        canContinue={canContinueAfterReveal}
        removedFromWheel={excludesWinners}
        busy={finishing}
        burstKey={revealing?.winner.id ?? 0}
        onNext={() => void onNext()}
        onFinish={() => void finishDraw()}
        onClose={() => void acknowledge().catch(onError)}
      />
      <DrawSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} snapshot={snapshot} onChanged={reload} />
    </div>
  );
}
