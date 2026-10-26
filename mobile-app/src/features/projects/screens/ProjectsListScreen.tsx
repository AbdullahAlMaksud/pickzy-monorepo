import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingView } from '@/components/ui/LoadingView';
import { SearchInput } from '@/components/ui/SearchInput';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ProjectListItem } from '@/features/home/components/ProjectListItem';

export function ProjectsListScreen() {
  const { t } = useTranslation(['projects', 'common']);
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 250);
  const query = useAsyncQuery((s) => s.projects.listProjects({ search: debounced, limit: 500 }), [debounced]);
  const openProject = useCallback((id: number) => router.push(`/project/${id}`), []);
  const projects = query.data;

  return (
    <ScreenContainer>
      <ScreenHeader
        title={t('list.title')}
        right={<IconButton icon="plus" label={t('new.title')} onPress={() => router.push('/project/new')} testID="list-add" />}
      />
      <View style={styles.search}>
        <SearchInput value={search} onChangeText={setSearch} placeholder={t('list.search')} testID="projects-search" />
      </View>
      {query.loading && !projects ? (
        <LoadingView />
      ) : query.error && !projects ? (
        <ErrorView message={t('common:errors.loadFailed')} onRetry={query.reload} />
      ) : (
        <FlatList
          data={projects ?? []}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item, index }) => <ProjectListItem project={item} colorIndex={index} onPress={openProject} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open"
              title={debounced ? t('list.emptySearch') : t('list.empty')}
              actionLabel={debounced ? undefined : t('new.title')}
              onAction={debounced ? undefined : () => router.push('/project/new')}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const Separator = () => <View style={styles.sep} />;

const styles = StyleSheet.create((theme) => ({
  search: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  list: { padding: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xxxl },
  sep: { height: theme.spacing.md },
}));
