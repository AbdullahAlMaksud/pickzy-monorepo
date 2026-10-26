import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppSwitch } from '@/components/ui/AppSwitch';
import { AppText } from '@/components/ui/AppText';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useServices } from '@/services/ServicesProvider';
import { notifyDataChanged } from '@/store/appStore';
import { showToast } from '@/store/toastStore';
import { SettingRow } from '../components/SettingRow';
import { SettingsGroup } from '../components/SettingsGroup';
import { WinnerCountStepper } from '../components/WinnerCountStepper';
import { useDrawErrorMessage } from '../hooks/useDrawErrors';
import { useDrawSession } from '../hooks/useDrawSession';
import { maxWinnerCount, normalizeRules, validateWinnerCount } from '../services/winnerSelection';
import type { DrawRules } from '../types';

export function DrawSettingsScreen({ drawId }: { drawId: number }) {
  const { t } = useTranslation(['wheel', 'common']);
  const { draws } = useServices();
  const errorMessage = useDrawErrorMessage();
  const { snapshot, loading, error, reload } = useDrawSession(drawId);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);
  const [rules, setRules] = useState<DrawRules | null>(null);

  useEffect(() => {
    if (snapshot) setRules(normalizeRules(snapshot.session));
  }, [snapshot]);

  const participantCount = snapshot?.participants.length ?? 0;
  const drawn = snapshot?.winners.length ?? 0;

  const persist = useCallback(
    async (next: DrawRules, options: { silent?: boolean } = {}) => {
      setSaving(true);
      try {
        const saved = await draws.updateRules(drawId, next);
        setRules(saved);
        setCountError(null);
        notifyDataChanged();
        await reload();
        if (!options.silent) showToast(t('settingsScreen.saved'), 'success');
        return true;
      } catch (e) {
        showToast(errorMessage(e), 'error');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [draws, drawId, errorMessage, reload, t],
  );

  const changeCount = useCallback(
    (count: number) => {
      if (!rules) return;
      const check = validateWinnerCount(count, participantCount, rules);
      if (!check.ok) {
        setCountError(
          check.code === 'EXCEEDS_POOL'
            ? t('settingsScreen.winnerCountTooMany', { max: check.max })
            : t('settingsScreen.winnerCountInvalid'),
        );
        return;
      }
      if (count < drawn) {
        setCountError(t('settingsScreen.winnerCountTooFew', { drawn }));
        return;
      }
      void persist({ ...rules, requestedWinnerCount: count }, { silent: true });
    },
    [rules, participantCount, drawn, persist, t],
  );

  /** Applies a rule toggle; if the new rule shrinks the allowed winner count, the count is lowered and the user told. */
  const changeFlags = useCallback(
    async (flags: Partial<Pick<DrawRules, 'allowRepeatWinners' | 'removeSelectedWinners'>>) => {
      if (!rules) return;
      let next = normalizeRules({ ...rules, ...flags });
      const max = maxWinnerCount(participantCount, next);
      let adjusted = false;
      if (next.requestedWinnerCount > max) {
        next = { ...next, requestedWinnerCount: Math.max(max, drawn, 1) };
        adjusted = true;
      }
      const ok = await persist(next, { silent: adjusted });
      if (ok && adjusted) showToast(t('settingsScreen.winnerCountAdjusted', { max: next.requestedWinnerCount }), 'info');
    },
    [rules, participantCount, drawn, persist, t],
  );

  const doReset = useCallback(async () => {
    setSaving(true);
    try {
      await draws.reset(drawId);
      setConfirmReset(false);
      notifyDataChanged();
      await reload();
      showToast(t('settingsScreen.resetDone'), 'success');
    } catch (e) {
      showToast(errorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  }, [draws, drawId, errorMessage, reload, t]);

  if (loading && !snapshot) {
    return (
      <SafeScreen scroll={false} header={<ScreenHeader title={t('settingsScreen.title')} />}>
        <LoadingView />
      </SafeScreen>
    );
  }
  if (error || !snapshot || !rules) {
    return (
      <SafeScreen scroll={false} header={<ScreenHeader title={t('settingsScreen.title')} />}>
        <ErrorView title={t('common:errors.loadFailed')} onRetry={() => void reload()} />
      </SafeScreen>
    );
  }

  const max = maxWinnerCount(participantCount, rules);
  const excluded = !rules.allowRepeatWinners || rules.removeSelectedWinners;
  const projectId = snapshot.session.projectId;

  return (
    <SafeScreen header={<ScreenHeader title={t('settingsScreen.title')} subtitle={snapshot.session.projectName} />} testID="draw-settings">
      <SettingsGroup title={t('settingsScreen.sectionParticipants')}>
        <SettingRow
          icon="users"
          title={t('settingsScreen.editParticipants')}
          description={`${t('settingsScreen.editParticipantsHint')} · ${t('settingsScreen.participantsNow', { count: participantCount })}`}
          showChevron
          onPress={() => projectId !== null && router.push(`/project/${projectId}/participants`)}
          testID="edit-participants-row"
        />
      </SettingsGroup>

      <SettingsGroup title={t('settingsScreen.sectionRules')}>
        <SettingRow
          icon="trophy"
          title={t('settingsScreen.winnerCount')}
          description={excluded ? t('settingsScreen.winnerCountHintExcluded', { max }) : t('settingsScreen.winnerCountHintRepeat', { max })}
          right={<WinnerCountStepper value={rules.requestedWinnerCount} min={Math.max(1, drawn)} max={max} disabled={saving} onChange={changeCount} />}
        />
        <SettingRow
          icon="rotate-ccw"
          title={t('settingsScreen.repeat')}
          description={rules.removeSelectedWinners ? t('settingsScreen.repeatDisabledHint') : t('settingsScreen.repeatHint')}
          right={
            <AppSwitch
              label={t('settingsScreen.repeat')}
              value={rules.allowRepeatWinners}
              disabled={saving || rules.removeSelectedWinners}
              onValueChange={(v) => void changeFlags({ allowRepeatWinners: v })}
              testID="switch-repeat"
            />
          }
        />
        <SettingRow
          icon="circle-minus"
          title={t('settingsScreen.remove')}
          description={t('settingsScreen.removeHint')}
          right={
            <AppSwitch
              label={t('settingsScreen.remove')}
              value={rules.removeSelectedWinners}
              disabled={saving}
              onValueChange={(v) => (v ? setConfirmRemove(true) : void changeFlags({ removeSelectedWinners: false }))}
              testID="switch-remove"
            />
          }
        />
        <SettingRow icon="shuffle" title={t('settingsScreen.method')} description={t('settingsScreen.methodHint')} right={<AppText variant="caption" tone="primary" weight="semibold" style={styles.value}>{t('settingsScreen.methodValue')}</AppText>} />
      </SettingsGroup>

      {countError ? (
        <AppText variant="caption" tone="error" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {countError}
        </AppText>
      ) : null}
      <AppText variant="caption" tone="muted">
        {t('settingsScreen.applyNote')}
      </AppText>

      <SettingsGroup title={t('settingsScreen.sectionDraw')}>
        <SettingRow
          icon="rotate-ccw"
          tone="danger"
          title={t('settingsScreen.reset')}
          description={t('settingsScreen.resetHint')}
          onPress={() => setConfirmReset(true)}
          testID="reset-draw-row"
        />
      </SettingsGroup>

      <View style={styles.footer}>
        <AppButton label={t('common:done')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>

      <ConfirmDialog
        visible={confirmReset}
        title={t('settingsScreen.resetTitle')}
        message={t('settingsScreen.resetMessage')}
        confirmLabel={t('settingsScreen.resetConfirm')}
        destructive
        loading={saving}
        onConfirm={() => void doReset()}
        onCancel={() => setConfirmReset(false)}
      />
      <ConfirmDialog
        visible={confirmRemove}
        title={t('settingsScreen.removeWarningTitle')}
        message={t('settingsScreen.removeWarningMessage')}
        confirmLabel={t('settingsScreen.removeWarningConfirm')}
        onConfirm={() => {
          setConfirmRemove(false);
          void changeFlags({ removeSelectedWinners: true });
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  value: { maxWidth: 110, textAlign: 'right' },
  footer: { marginTop: theme.spacing.sm },
}));
