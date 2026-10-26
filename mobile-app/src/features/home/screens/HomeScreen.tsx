import { router } from 'expo-router';
import { useCallback } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useLocale } from '@/hooks/useLocale';
import { useAppStore } from '@/store/appStore';
import { dayPartOf } from '@/utils/format';
import { ActionCard } from '../components/ActionCard';
import { ProjectListItem } from '../components/ProjectListItem';
import { StatCard } from '../components/StatCard';

const NAV_BG = require('../../../assets/images/Artboard-1 (1).png');

const RECENT_LIMIT = 5;

export function HomeScreen() {
  const { t } = useTranslation(['home', 'common']);
  const { number } = useLocale();
  const profile = useAppStore((s) => s.preferences);

  const query = useAsyncQuery(async (s) => ({
    stats: await s.projects.getStats(),
    recent: await s.projects.listProjects({ limit: RECENT_LIMIT }),
  }));

  const openProject = useCallback((id: number) => router.push(`/project/${id}`), []);
  const openProfile = useCallback(() => router.navigate('/profile'), []);

  const greetingWord = t(`home:greeting.${dayPartOf(Date.now())}`);
  const greeting = profile.displayName
    ? t('home:greeting.withName', { greeting: greetingWord, name: profile.displayName })
    : t('home:greeting.withoutName', { greeting: greetingWord });

  const data = query.data;

  return (
    <ScreenContainer edges={[]}>
      <Image
        source={NAV_BG}
        style={styles.navBg}
        resizeMode="cover"
        pointerEvents="none"
        accessible={false}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <View style={styles.brandTitleRow}>
              <AppLogo size={36} />
              <AppText variant="display" tone="primary" accessibilityRole="header">
                {t('common:appName')}
              </AppText>
            </View>
            <AppText variant="body" tone="secondary">
              {t('home:tagline')}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('home:openProfile')} onPress={openProfile} hitSlop={8} testID="home-avatar">
            <Avatar name={profile.displayName} photoUri={profile.photoUri} size={44} />
          </Pressable>
        </View>

        <AppText variant="title" tone="secondary" testID="home-greeting">
          {greeting}
        </AppText>

        <ActionCard
          icon="plus"
          variant="primary"
          title={t('home:create.title')}
          subtitle={t('home:create.subtitle')}
          onPress={() => router.push('/project/new')}
          testID="create-new-project"
        />
        <ActionCard
          icon="folder-open"
          variant="soft"
          title={t('home:myProjects.title')}
          subtitle={t('home:myProjects.subtitle')}
          onPress={() => router.push('/projects')}
          testID="my-projects"
        />

        {query.loading && !data ? (
          <LoadingView />
        ) : query.error && !data ? (
          <ErrorView message={t('common:errors.loadFailed')} onRetry={query.reload} />
        ) : data ? (
          <>
            <View style={styles.stats}>
              <StatCard icon="folder" value={number(data.stats.projects)} label={t('home:stats.projects')} testID="stat-projects" />
              <StatCard icon="users" value={number(data.stats.participants)} label={t('home:stats.participants')} testID="stat-participants" />
              <StatCard icon="trophy" value={number(data.stats.winners)} label={t('home:stats.winners')} testID="stat-winners" />
            </View>

            {data.recent.length === 0 ? (
              <EmptyState
                icon="sparkles"
                title={t('home:empty.title')}
                message={t('home:empty.message')}
                actionLabel={t('home:empty.action')}
                onAction={() => router.push('/project/new')}
                testID="home-empty"
              />
            ) : (
              <View style={styles.recent}>
                <SectionHeader title={t('home:recent.title')} actionLabel={t('home:recent.seeAll')} onAction={() => router.push('/projects')} />
                {data.recent.map((project, i) => (
                  <ProjectListItem key={project.id} project={project} colorIndex={i} onPress={openProject} />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  navBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: rt.insets.top + 160,
    opacity: theme.isDark ? 0.35 : 0.95,
  },
  content: {
    paddingTop: rt.insets.top + theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { gap: 2 },
  brandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  stats: { flexDirection: 'row', gap: theme.spacing.md },
  recent: { gap: theme.spacing.md },
}));
