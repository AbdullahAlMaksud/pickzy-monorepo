import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Share, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorView } from '@/components/ui/ErrorView';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingView } from '@/components/ui/LoadingView';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useLocale } from '@/hooks/useLocale';
import type { DrawParticipant } from '@/features/wheel/types';
import { RulesSummary } from '../components/RulesSummary';

export function HistoryDetailScreen({ historyId }: { historyId: number }) {
  const { t } = useTranslation(['history', 'common']);
  const { dateTime, number, ordinal } = useLocale();
  const query = useAsyncQuery((s) => s.history.getDetail(historyId), [historyId]);
  const detail = query.data;

  // Draw participants that won, so we can mark them with a text badge in the roster.
  const winnerIds = useMemo(() => new Set((detail?.winners ?? []).map((w) => w.drawParticipantId)), [detail]);

  if (query.loading && !detail) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('detail.title')} />
        <LoadingView />
      </ScreenContainer>
    );
  }
  if (query.error || !detail) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('detail.title')} />
        <ErrorView title={t('detail.notFound')} onRetry={query.error ? query.reload : () => router.replace('/history')} />
      </ScreenContainer>
    );
  }

  const { session, winners, participants } = detail;

  const share = async () => {
    const winnersText = winners
      .map((w) => t('detail.shareWinnersLine', { place: ordinal(w.winnerOrder), name: w.displayName }))
      .join('\n');
    try {
      await Share.share({
        message: t('detail.shareMessage', {
          project: session.projectName,
          date: dateTime(session.completedAt ?? session.updatedAt),
          winners: winnersText,
        }),
      });
    } catch {
      // the user dismissed the share sheet or sharing is unavailable: nothing to do
    }
  };

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.meta}>
        <AppText variant="heading" numberOfLines={2}>
          {session.projectName}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('detail.completedAt')}: {dateTime(session.completedAt ?? session.updatedAt)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('detail.originalCount')}: {number(participants.length)}
        </AppText>
        {session.projectId === null ? (
          <AppText variant="caption" tone="warning">
            {t('detail.projectDeleted')}
          </AppText>
        ) : null}
      </View>

      <View style={styles.winnerBox} testID="history-winners">
        <AppText variant="label" weight="semibold" style={styles.winnerHeading}>
          {winners.length === 1 ? t('detail.winner') : t('detail.winnersHeading')}
        </AppText>
        {winners.map((w) => (
          <View key={w.id} style={styles.winnerRow}>
            <Avatar name={w.displayName} size={40} colorIndex={w.winnerOrder - 1} />
            <View style={styles.flex}>
              <AppText variant="caption" tone="muted">
                {t('detail.order', { order: w.winnerOrder })}
              </AppText>
              <AppText variant="heading" numberOfLines={2}>
                {w.displayName}
              </AppText>
            </View>
            <Icon name="crown" size="md" color="gold" />
          </View>
        ))}
      </View>

      <RulesSummary session={session} />

      <View>
        <AppText variant="heading" accessibilityRole="header">
          {t('detail.participantsHeading', { count: participants.length })}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('detail.snapshotNote')}
        </AppText>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScreenHeader
        title={t('detail.title')}
        right={<IconButton icon="share-2" label={t('detail.share')} onPress={share} testID="history-share" />}
      />
      <FlatList
        data={participants}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item, index }) => <RosterRow participant={item} index={index} isWinner={winnerIds.has(item.id)} winnerLabel={t('detail.winnerBadge')} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <AppText variant="caption" tone="muted" align="center" style={styles.empty}>
            {t('detail.participantsEmpty')}
          </AppText>
        }
        contentContainerStyle={styles.list}
        initialNumToRender={16}
        windowSize={9}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function RosterRow({
  participant,
  index,
  isWinner,
  winnerLabel,
}: {
  participant: DrawParticipant;
  index: number;
  isWinner: boolean;
  winnerLabel: string;
}) {
  return (
    <View style={styles.rosterRow} accessible accessibilityLabel={isWinner ? `${participant.displayName}, ${winnerLabel}` : participant.displayName}>
      <Avatar name={participant.displayName} size={32} colorIndex={index} />
      <AppText variant="body" style={styles.flex} numberOfLines={2}>
        {participant.displayName}
      </AppText>
      {isWinner ? (
        <View style={styles.badge}>
          <Icon name="crown" size="xs" color="winnerCardText" />
          <AppText variant="micro" weight="semibold" style={styles.badgeText}>
            {winnerLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  headerContent: { gap: theme.spacing.lg, paddingBottom: theme.spacing.md, paddingTop: theme.spacing.sm },
  meta: { gap: 2 },
  winnerBox: { gap: theme.spacing.sm, padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: theme.colors.winnerCard },
  winnerHeading: { color: theme.colors.winnerCardText },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.winnerCard,
  },
  badgeText: { color: theme.colors.winnerCardText },
  empty: { padding: theme.spacing.xl },
}));
