import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/layout';
import {
  AppLogo,
  AppText,
  ErrorView,
  Icon,
  LoadingView,
} from '@/components/ui';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useLocale } from '@/hooks/useLocale';
import { haptic } from '@/utils/haptics';
import { HomeBannerWave } from '../components/HomeBannerWave';
import { ProjectGridCard } from '../components/ProjectGridCard';
import { ProjectListItem } from '../components/ProjectListItem';

const RECENT_LIMIT = 10;

export function HomeScreen() {
  const { t } = useTranslation(['home', 'common']);
  const { number } = useLocale();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const query = useAsyncQuery(async (s) => ({
    stats: await s.projects.getStats(),
    recent: await s.projects.listProjects({ limit: RECENT_LIMIT }),
  }));

  const openProject = useCallback((id: number) => router.push(`/project/${id}`), []);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setStyle('light');
    }, [])
  );

  const toggleViewMode = () => {
    haptic.selection();
    setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
  };

  const data = query.data;
  const hasProjects = !!(data && data.recent.length > 0);

  const renderCreateProjectCard = () => (
    <Pressable
      onPress={() => router.push('/project/new')}
      style={({ pressed }) => [styles.createProjectCard, pressed && styles.cardPressed]}
      testID="create-new-project"
      accessibilityRole="button"
      accessibilityLabel={t('home:createProject')}
    >
      <Icon name="plus" size="lg" color="#FFFFFF" />
      <AppText variant="label" weight="medium" style={styles.createProjectText}>
        {t('home:createProject')}
      </AppText>
    </Pressable>
  );

  const renderDashboardRow = () => (
    <View style={styles.dashboardRow}>
      {/* Left: My Project Card */}
      <Pressable
        onPress={() => router.push('/projects')}
        style={({ pressed }) => [styles.myProjectCard, pressed && styles.cardPressed]}
        testID="my-projects"
        accessibilityRole="button"
        accessibilityLabel={t('home:myProject')}
      >
        <Icon name="aperture" size="xl" color="text" />
        <AppText variant="label" weight="semibold" style={styles.myProjectText}>
          {t('home:myProject')}
        </AppText>
      </Pressable>

      {/* Right: 3 Stacked Stat Rows */}
      <View style={styles.statsColumn}>
        <View style={styles.statRow} testID="stat-projects">
          <View style={styles.statLeft}>
            <Icon name="aperture" size="sm" color="textSecondary" />
            <AppText variant="caption" tone="secondary" style={styles.statLabel}>
              {t('home:stats.projects')}
            </AppText>
          </View>
          <AppText variant="heading" weight="bold" style={styles.statValue}>
            {number(data?.stats.projects ?? 0)}
          </AppText>
        </View>

        <View style={styles.statRow} testID="stat-participants">
          <View style={styles.statLeft}>
            <Icon name="users" size="sm" color="textSecondary" />
            <AppText variant="caption" tone="secondary" style={styles.statLabel}>
              {t('home:stats.participants')}
            </AppText>
          </View>
          <AppText variant="heading" weight="bold" style={styles.statValue}>
            {number(data?.stats.participants ?? 0)}
          </AppText>
        </View>

        <View style={styles.statRow} testID="stat-winners">
          <View style={styles.statLeft}>
            <Icon name="heart" size="sm" color="textSecondary" />
            <AppText variant="caption" tone="secondary" style={styles.statLabel}>
              {t('home:stats.winners')}
            </AppText>
          </View>
          <AppText variant="heading" weight="bold" style={styles.statValue}>
            {number(data?.stats.winners ?? 0)}
          </AppText>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={[]}>
      <StatusBar style="light" />
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Banner Header with SVG Wave Background */}
          <View style={styles.bannerContainer}>
            <HomeBannerWave
              style={styles.bannerBg}
              preserveAspectRatio="none"
              pointerEvents="none"
            />

            <View style={styles.headerContent}>
              <AppLogo size={46} />
              <AppText
                variant="display"
                weight="bold"
                style={styles.brandTitle}
                accessibilityRole="header"
              >
                {t('common:appName')}
              </AppText>
              <AppText variant="caption" style={styles.tagline}>
                {t('home:tagline')}
              </AppText>
            </View>
          </View>

          {/* Overlapping Content Sheet */}
          <View style={styles.mainSheet}>
            {query.loading && !data ? (
              <LoadingView />
            ) : query.error && !data ? (
              <ErrorView message={t('common:errors.loadFailed')} onRetry={query.reload} />
            ) : !hasProjects ? (
              /* Screen 1: Empty state ordering */
              <>
                {renderDashboardRow()}
                <View style={styles.sectionSpacer}>
                  {renderCreateProjectCard()}
                </View>

                <View style={styles.emptyContainer} testID="home-empty">
                  <View style={styles.dashedBox} />
                  <AppText variant="caption" tone="secondary" style={styles.emptyText}>
                    {t('home:noProject')}
                  </AppText>
                </View>
              </>
            ) : (
              /* Screen 2 & 3: Projects exist ordering */
              <>
                {renderCreateProjectCard()}
                <View style={styles.sectionSpacer}>
                  {renderDashboardRow()}
                </View>

                {/* Recent Section Header */}
                <View style={styles.recentHeaderRow}>
                  <AppText variant="heading" weight="semibold" style={styles.recentTitle}>
                    {t('home:recentHeader')}
                  </AppText>

                  <Pressable
                    onPress={toggleViewMode}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle recent view mode"
                    style={styles.toggleButton}
                    testID="toggle-view-mode"
                  >
                    <Icon
                      name={viewMode === 'list' ? 'layout-list' : 'layout-grid'}
                      size="md"
                      color="text"
                    />
                  </Pressable>
                </View>

                {/* Recent Items List or Grid */}
                {viewMode === 'list' ? (
                  <View style={styles.listContainer}>
                    {data.recent.map((project, i) => (
                      <ProjectListItem
                        key={project.id}
                        project={project}
                        colorIndex={i}
                        onPress={openProject}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.gridContainer}>
                    {data.recent.map((project, i) => (
                      <ProjectGridCard
                        key={project.id}
                        project={project}
                        colorIndex={i}
                        onPress={openProject}
                        style={styles.gridItem}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Floating Create Button at bottom-right corner */}
        <Pressable
          onPress={() => router.push('/project/new')}
          style={({ pressed }) => [styles.floatingButton, pressed && styles.floatingButtonPressed]}
          testID="floating-create-button"
          accessibilityRole="button"
          accessibilityLabel={t('home:createProject')}
        >
          <Icon name="plus" size="md" color="onPrimary" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  bannerContainer: {
    backgroundColor: '#121316',
    paddingTop: rt.insets.top + theme.spacing.lg,
    paddingBottom: theme.spacing.xxl + 16,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: 6,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    textAlign: 'center',
  },
  mainSheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -22,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  sectionSpacer: {
    marginTop: theme.spacing.md,
  },
  createProjectCard: {
    backgroundColor: '#000000',
    borderRadius: 22,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...theme.shadows.md,
  },
  createProjectText: {
    color: '#FFFFFF',
  },
  cardPressed: {
    opacity: 0.9,
  },
  dashboardRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  myProjectCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  myProjectText: {
    color: theme.colors.text,
  },
  statsColumn: {
    flex: 1,
    gap: 8,
  },
  statRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    minHeight: 44,
    ...theme.shadows.sm,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: theme.colors.textSecondary,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 54,
    gap: 14,
  },
  dashedBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderStrong,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  recentTitle: {
    color: theme.colors.text,
  },
  toggleButton: {
    padding: theme.spacing.xs,
  },
  listContainer: {
    gap: theme.spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  gridItem: {
    width: '48%',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    zIndex: 99,
  },
  floatingButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
}));
