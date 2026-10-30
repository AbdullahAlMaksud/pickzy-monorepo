'use client';

import Link from 'next/link';
import { RotateCcw, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/hooks/useLocale';
import { useServices } from '@/lib/services-context';
import { notifyDataChanged } from '@/store/appStore';
import { useDrawErrorMessage } from '../hooks/useDrawErrors';
import { maxWinnerCount, normalizeRules, validateWinnerCount, winnersAreExcluded } from '../services/winnerSelection';
import type { DrawRules, DrawSnapshot } from '../types';
import { WinnerCountStepper } from './WinnerCountStepper';

interface DrawSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: DrawSnapshot;
  onChanged: () => void;
}

/** Rules of the unfinished draw: how many winners, repeats, removal, and restarting. */
export function DrawSettingsSheet({ open, onOpenChange, snapshot, onChanged }: DrawSettingsSheetProps) {
  const { t } = useTranslation(['wheel', 'common']);
  const { number } = useLocale();
  const { draws } = useServices();
  const errorMessage = useDrawErrorMessage();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);

  const rules = normalizeRules(snapshot.session);
  const participantCount = snapshot.participants.length;
  const drawn = snapshot.winners.length;
  const max = maxWinnerCount(participantCount, rules);
  const excluded = winnersAreExcluded(rules);
  const projectId = snapshot.session.projectId;
  const drawId = snapshot.session.id;

  const persist = async (next: DrawRules, silent = false): Promise<boolean> => {
    setSaving(true);
    try {
      await draws.updateRules(drawId, next);
      setCountError(null);
      notifyDataChanged();
      onChanged();
      if (!silent) toast.success(t('wheel:settingsScreen.saved'));
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeCount = (count: number) => {
    const check = validateWinnerCount(count, participantCount, rules);
    if (!check.ok) {
      setCountError(check.code === 'EXCEEDS_POOL' ? t('wheel:settingsScreen.winnerCountTooMany', { max: check.max }) : t('wheel:settingsScreen.winnerCountInvalid'));
      return;
    }
    if (count < drawn) {
      setCountError(t('wheel:settingsScreen.winnerCountTooFew', { drawn }));
      return;
    }
    void persist({ ...rules, requestedWinnerCount: count }, true);
  };

  /** Applies a rule toggle. If the new rule shrinks the allowed winner count, the count is lowered and the person is told. */
  const changeFlags = async (flags: Partial<Pick<DrawRules, 'allowRepeatWinners' | 'removeSelectedWinners'>>) => {
    let next = normalizeRules({ ...rules, ...flags });
    const limit = maxWinnerCount(participantCount, next);
    const adjusted = next.requestedWinnerCount > limit;
    if (adjusted) next = { ...next, requestedWinnerCount: Math.max(limit, drawn, 1) };
    const ok = await persist(next, adjusted);
    if (ok && adjusted) toast.info(t('wheel:settingsScreen.winnerCountAdjusted', { max: next.requestedWinnerCount }));
  };

  const reset = async () => {
    setSaving(true);
    try {
      await draws.reset(drawId);
      notifyDataChanged();
      onChanged();
      toast.success(t('wheel:settingsScreen.resetDone'));
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto" closeLabel={t('common:close')} data-testid="draw-settings">
          <SheetHeader>
            <SheetTitle>{t('wheel:settingsScreen.title')}</SheetTitle>
            <SheetDescription>{snapshot.session.projectName}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-5 px-4 pb-6">
            <section className="grid gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{t('wheel:settingsScreen.sectionParticipants')}</h3>
              <p>{t('wheel:settingsScreen.participantsNow', { count: participantCount })}</p>
              {projectId !== null ? (
                <Button asChild variant="outline" className="justify-start">
                  <Link href={`/projects/${projectId}`}>
                    <Users aria-hidden />
                    {t('wheel:settingsScreen.editParticipants')}
                  </Link>
                </Button>
              ) : null}
              <p className="text-xs text-muted-foreground">{t('wheel:settingsScreen.editParticipantsHint')}</p>
            </section>

            <Separator />

            <section className="grid gap-4">
              <h3 className="text-sm font-semibold text-muted-foreground">{t('wheel:settingsScreen.sectionRules')}</h3>

              <div className="grid gap-2">
                <Label>{t('wheel:settingsScreen.winnerCount')}</Label>
                <WinnerCountStepper value={rules.requestedWinnerCount} min={Math.max(1, drawn)} max={max} disabled={saving} onChange={changeCount} />
                <p className="text-xs text-muted-foreground">
                  {excluded ? t('wheel:settingsScreen.winnerCountHintExcluded', { max }) : t('wheel:settingsScreen.winnerCountHintRepeat', { max })}
                </p>
                {countError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {countError}
                  </p>
                ) : null}
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="rule-repeat">{t('wheel:settingsScreen.repeat')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {rules.removeSelectedWinners ? t('wheel:settingsScreen.repeatDisabledHint') : t('wheel:settingsScreen.repeatHint')}
                  </p>
                </div>
                <Switch
                  id="rule-repeat"
                  checked={rules.allowRepeatWinners}
                  disabled={saving || rules.removeSelectedWinners}
                  onCheckedChange={(v) => void changeFlags({ allowRepeatWinners: v })}
                  data-testid="rule-repeat"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="rule-remove">{t('wheel:settingsScreen.remove')}</Label>
                  <p className="text-xs text-muted-foreground">{t('wheel:settingsScreen.removeHint')}</p>
                </div>
                <Switch
                  id="rule-remove"
                  checked={rules.removeSelectedWinners}
                  disabled={saving}
                  onCheckedChange={(v) => (v ? setConfirmRemove(true) : void changeFlags({ removeSelectedWinners: false }))}
                  data-testid="rule-remove"
                />
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">
                  {t('wheel:settingsScreen.method')}: {t('wheel:settingsScreen.methodValue')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t('wheel:settingsScreen.methodHint')}</p>
              </div>
              <p className="text-xs text-muted-foreground">{t('wheel:settingsScreen.applyNote')}</p>
            </section>

            <Separator />

            <section className="grid gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{t('wheel:settingsScreen.sectionDraw')}</h3>
              <Button variant="outline" className="justify-start" onClick={() => setConfirmReset(true)} disabled={saving} data-testid="reset-draw">
                <RotateCcw aria-hidden />
                {t('wheel:settingsScreen.reset')}
              </Button>
              <p className="text-xs text-muted-foreground">{t('wheel:settingsScreen.resetHint')}</p>
            </section>
            <span className="sr-only">{number(drawn)}</span>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={t('wheel:settingsScreen.removeWarningTitle')}
        description={t('wheel:settingsScreen.removeWarningMessage')}
        confirmLabel={t('wheel:settingsScreen.removeWarningConfirm')}
        onConfirm={() => changeFlags({ removeSelectedWinners: true })}
      />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t('wheel:settingsScreen.resetTitle')}
        description={t('wheel:settingsScreen.resetMessage')}
        confirmLabel={t('wheel:settingsScreen.resetConfirm')}
        destructive
        onConfirm={reset}
      />
    </>
  );
}
