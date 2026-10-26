import { router } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorView } from '@/components/ui/ErrorView';
import { Icon } from '@/components/ui/Icon';
import { LoadingView } from '@/components/ui/LoadingView';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useLocale } from '@/hooks/useLocale';
import { RulesSummary } from '@/features/history/components/RulesSummary';

export function ResultScreen({ drawId }: { drawId: number }) {
  const { t } = useTranslation(['wheel', 'common']);
  const { dateTime, ordinal } = useLocale();
  const query = useAsyncQuery((s) => s.history.getDetail(drawId), [drawId]);
  const goHome = () => router.replace('/');

  if (query.loading && !query.data) {
    return (
      <SafeScreen scroll={false} header={<ScreenHeader title={t('result.title')} hideBack />}>
        <LoadingView />
      </SafeScreen>
    );
  }
  const detail = query.data;
  if (query.error || !detail) {
    return (
      <SafeScreen scroll={false} header={<ScreenHeader title={t('result.title')} onBack={goHome} />}>
        <ErrorView title={t('result.notFound')} onRetry={query.reload} />
      </SafeScreen>
    );
  }
  const { session, winners } = detail;
  const projectId = session.projectId;

  return (
    <SafeScreen
      header={<ScreenHeader title={t('result.title')} subtitle={session.projectName} onBack={goHome} />}
      testID="result-screen"
    >
      <View style={styles.hero}>
        <View style={styles.crown}>
          <Icon name="trophy" size="xl" color="gold" />
        </View>
        <AppText variant="title" accessibilityRole="header">
          {t('result.heading')}
        </AppText>
        {session.completedAt ? (
          <AppText variant="caption" tone="muted">
            {dateTime(session.completedAt)}
          </AppText>
        ) : null}
      </View>

      <View style={styles.list}>
        {winners.map((w, i) => (
          <AppCard key={w.id} style={styles.winnerRow} testID={`result-winner-${w.winnerOrder}`}>
            <Avatar name={w.displayName} size={44} colorIndex={i} />
            <View style={styles.winnerText}>
              <AppText variant="caption" tone="muted">
                {t('result.winnerLabel', { place: ordinal(w.winnerOrder) })}
              </AppText>
              <AppText variant="heading" numberOfLines={2}>
                {w.displayName}
              </AppText>
            </View>
            <Icon name="crown" size="md" color="gold" />
          </AppCard>
        ))}
      </View>

      <RulesSummary session={session} />

      <View style={styles.actions}>
        {projectId !== null ? (
          <AppButton label={t('result.newDraw')} icon="rotate-ccw" onPress={() => router.replace(`/project/${projectId}`)} testID="new-draw" />
        ) : null}
        <AppButton label={t('result.viewHistory')} variant="secondary" onPress={() => router.replace(`/history/${session.id}`)} />
        <AppButton label={t('result.home')} variant="ghost" onPress={goHome} />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm },
  crown: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.winnerCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: theme.spacing.sm },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  winnerText: { flex: 1 },
  actions: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
}));
