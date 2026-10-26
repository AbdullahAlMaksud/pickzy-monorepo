import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingView } from '@/components/ui/LoadingView';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useLocale } from '@/hooks/useLocale';
import { useServices } from '@/services/ServicesProvider';
import { notifyDataChanged } from '@/store/appStore';
import { showToast } from '@/store/toastStore';
import { sizes } from '@/theme/tokens';
import { SpinWheel, type SpinWheelHandle } from '../components/SpinWheel';
import { WinnerCard } from '../components/WinnerCard';
import { WinnerModal } from '../components/WinnerModal';
import { useDrawErrorMessage } from '../hooks/useDrawErrors';
import { useDrawSession } from '../hooks/useDrawSession';
import { useSpinController } from '../hooks/useSpinController';
import { computeLabelLayout } from '../services/wheelGeometry';
import { winnersAreExcluded } from '../services/winnerSelection';
import { getDrawProgress, normalizeRules } from '../services/winnerSelection';
import type { DrawParticipant } from '../types';

const ROW_HEIGHT = 52;

export function SpinScreen({ drawId }: { drawId: number }) {
  const { t } = useTranslation(['wheel', 'common']);
  const { number, ordinal } = useLocale();
  const { draws } = useServices();
  const { width } = useWindowDimensions();
  const wheelRef = useRef<SpinWheelHandle>(null);
  const errorMessage = useDrawErrorMessage();
  const [finishing, setFinishing] = useState(false);

  const { snapshot, loading, error, reload } = useDrawSession(drawId);

  const onError = useCallback((e: unknown) => showToast(errorMessage(e), 'error'), [errorMessage]);
  const { phase, revealing, wheelItems, eligible, spin, acknowledge } = useSpinController({
    drawId,
    snapshot,
    wheelRef,
    reload,
    onError,
  });

  const rules = useMemo(() => (snapshot ? normalizeRules(snapshot.session) : null), [snapshot]);
  const winnerIds = useMemo(() => snapshot?.winners.map((w) => w.drawParticipantId) ?? [], [snapshot]);
  const progress = useMemo(
    () => (snapshot && rules ? getDrawProgress(snapshot.participants.length, winnerIds, rules) : null),
    [snapshot, rules, winnerIds],
  );

  const wheelSize = Math.min(width - 48, sizes.wheelMax);
  const labelsHidden = useMemo(
    () => !computeLabelLayout(wheelItems.length, (wheelSize / 2) * 0.91).visible && wheelItems.length > 0,
    [wheelItems.length, wheelSize],
  );

  const busy = phase !== 'idle';
  const canSpin = !busy && progress?.kind === 'ready' && wheelItems.length > 0;
  const canFinish = !busy && !!snapshot && snapshot.winners.length > 0 && (progress?.kind === 'complete' || progress?.kind === 'exhausted');

  const finishDraw = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      if (revealing) await draws.acknowledgeWinner(revealing.winner.id);
      await draws.finish(drawId);
      notifyDataChanged();
      router.replace(`/draw/${drawId}/result`);
    } catch (e) {
      showToast(errorMessage(e), 'error');
      setFinishing(false);
    }
  }, [draws, drawId, errorMessage, finishing, revealing]);

  const excludesWinners = !!rules && winnersAreExcluded(rules);
  // While a winner is on screen the snapshot is one result behind: the frozen wheel still holds them.
  const canContinueAfterReveal = excludesWinners ? wheelItems.length > 1 : true;
  const canPickMoreNow = !busy && !!snapshot && snapshot.winners.length > 0 && progress?.kind === 'complete' && (excludesWinners ? eligible.length > 0 : true);

  const onNext = useCallback(async () => {
    try {
      // After the planned winners: raise the winner count by one ("2nd place", "3rd place"...).
      if (revealing && revealing.order >= revealing.requested) await draws.addWinnerSlot(drawId);
      await acknowledge();
      // let the modal close and the wheel update before the next spin starts
      setTimeout(() => void spin(), 250);
    } catch (e) {
      onError(e);
    }
  }, [acknowledge, draws, drawId, onError, revealing, spin]);

  const pickMore = useCallback(async () => {
    try {
      await draws.addWinnerSlot(drawId);
      await reload();
      setTimeout(() => void spin(), 250);
    } catch (e) {
      onError(e);
    }
  }, [draws, drawId, onError, reload, spin]);

  const onCloseModal = useCallback(async () => {
    try {
      await acknowledge();
    } catch (e) {
      onError(e);
    }
  }, [acknowledge, onError]);

  const openSettings = useCallback(() => router.push(`/draw/${drawId}/settings`), [drawId]);

  const renderItem = useCallback(
    ({ item, index }: { item: DrawParticipant; index: number }) => (
      <View style={styles.row} accessible accessibilityLabel={item.displayName}>
        <Avatar name={item.displayName} size={32} colorIndex={index} />
        <AppText variant="label" tone="stage" numberOfLines={1} style={styles.rowName}>
          {item.displayName}
        </AppText>
      </View>
    ),
    [],
  );

  if (loading && !snapshot) {
    return (
      <ScreenContainer tone="stage">
        <StatusBar style="light" />
        <LoadingView />
      </ScreenContainer>
    );
  }
  if (error || !snapshot || !rules) {
    return (
      <ScreenContainer tone="stage">
        <StatusBar style="light" />
        <ScreenHeader title={t('common:appName')} tone="stage" />
        <ErrorView title={t('common:errors.loadFailed')} onRetry={() => void reload()} />
      </ScreenContainer>
    );
  }

  const total = rules.requestedWinnerCount;
  const done = snapshot.winners.length;
  const spinLabel = phase === 'spinning' || phase === 'selecting' ? t('spinning') : t('spin');

  const header = (
    <View style={styles.headerContent}>
      {progress?.kind === 'empty' ? (
        <EmptyState
          icon="users"
          title={t('empty.title')}
          message={t('empty.message')}
          actionLabel={t('empty.action')}
          onAction={() => snapshot.session.projectId && router.push(`/project/${snapshot.session.projectId}/participants`)}
        />
      ) : progress?.kind === 'exhausted' && wheelItems.length === 0 ? (
        <View style={styles.notice}>
          <AppText variant="heading" tone="stage" align="center">
            {t('noEligible.title')}
          </AppText>
          <AppText tone="stageMuted" align="center">
            {t('noEligible.message')}
          </AppText>
        </View>
      ) : (
        <View style={styles.wheelWrap}>
          <SpinWheel
            ref={wheelRef}
            items={wheelItems}
            size={wheelSize}
            spinLabel={spinLabel}
            spinHint={t('spinButtonHint')}
            spinDisabled={!canSpin}
            onSpinPress={() => void spin()}
          />
        </View>
      )}

      <View style={styles.chips}>
        <View style={styles.chip}>
          <AppText variant="caption" tone="stage" weight="semibold">
            {t('progress', { done, total })}
          </AppText>
        </View>
        <View style={styles.chip}>
          <AppText variant="caption" tone="stageMuted">
            {t('eligible', { count: wheelItems.length })}
          </AppText>
        </View>
      </View>

      {progress?.kind === 'complete' ? (
        <View style={styles.notice} accessibilityRole="alert">
          <AppText variant="label" tone="stage" weight="semibold" align="center">
            {t('complete.title')}
          </AppText>
          <AppText variant="caption" tone="stageMuted" align="center">
            {t('complete.message')}
          </AppText>
        </View>
      ) : null}

      {canPickMoreNow ? (
        <AppButton
          label={t('pickMore', { place: ordinal(done + 1) })}
          iconRight="arrow-right"
          onPress={() => void pickMore()}
          testID="spin-more"
        />
      ) : null}

      {canFinish ? (
        <AppButton
          label={finishing ? t('finishing') : t('finish')}
          icon="trophy"
          variant={canPickMoreNow ? 'secondary' : 'primary'}
          onPress={() => void finishDraw()}
          loading={finishing}
          testID="finish-draw"
        />
      ) : (
        <AppButton
          label={spinLabel}
          onPress={() => void spin()}
          disabled={!canSpin}
          loading={phase === 'selecting'}
          testID="spin-button"
          accessibilityHint={t('spinButtonHint')}
        />
      )}

      <View style={styles.section}>
        <AppText variant="heading" tone="stage" accessibilityRole="header">
          {t('winnersTitle')}
        </AppText>
        {snapshot.winners.length === 0 ? (
          <AppText variant="caption" tone="stageMuted">
            {t('noWinnersYet')}
          </AppText>
        ) : (
          snapshot.winners.map((w, i) => (
            <WinnerCard
              key={w.id}
              name={w.displayName}
              positionLabel={t('result.winnerLabel', { place: ordinal(w.winnerOrder) })}
              colorIndex={i}
              testID={`winner-card-${w.winnerOrder}`}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="heading" tone="stage" accessibilityRole="header">
          {t('participantsList')} ({number(wheelItems.length)})
        </AppText>
        {labelsHidden ? (
          <AppText variant="caption" tone="stageMuted">
            {t('tooManyLabels')}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  return (
    <ScreenContainer tone="stage">
      <StatusBar style="light" />
      <ScreenHeader
        title={snapshot.session.projectName}
        subtitle={t('common:participants', { count: snapshot.participants.length })}
        tone="stage"
        right={<IconButton icon="settings" label={t('settings')} variant="stage" color="stageText" disabled={busy} onPress={openSettings} testID="open-draw-settings" />}
      />
      <FlatList
        data={wheelItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        contentContainerStyle={styles.listContent}
        initialNumToRender={20}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />
      <WinnerModal
        visible={!!revealing}
        winnerId={revealing?.winner.id ?? null}
        winnerName={revealing?.winner.displayName ?? ''}
        projectName={snapshot.session.projectName}
        order={revealing?.order ?? 0}
        isLast={(revealing?.order ?? 0) >= (revealing?.requested ?? total)}
        canContinue={canContinueAfterReveal}
        removedFromWheel={excludesWinners}
        busy={finishing}
        colorIndex={(revealing?.order ?? 1) - 1}
        onNext={() => void onNext()}
        onFinish={() => void finishDraw()}
        onClose={() => void onCloseModal()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerContent: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  wheelWrap: { alignItems: 'center', paddingTop: theme.spacing.md },
  chips: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.stageSurface,
  },
  notice: { gap: theme.spacing.xs, padding: theme.spacing.lg, borderRadius: theme.radii.md, backgroundColor: theme.colors.stageSurface },
  section: { gap: theme.spacing.sm },
  listContent: { paddingBottom: theme.spacing.xxxl },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.stageRing,
  },
  rowName: { flex: 1 },
}));
