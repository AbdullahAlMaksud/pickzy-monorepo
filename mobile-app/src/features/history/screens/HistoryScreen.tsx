import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { SearchInput } from '@/components/ui/SearchInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { HistoryOrder } from '@/database/repositories/historyRepository';
import { HistoryItem } from '../components/HistoryItem';
import { useHistoryList } from '../hooks/useHistoryList';

export function HistoryScreen() {
  const { t } = useTranslation(['history', 'common']);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<HistoryOrder>('newest');
  const debounced = useDebouncedValue(search, 250);
  const list = useHistoryList(debounced, order);
  const open = useCallback((id: number) => router.push(`/history/${id}`), []);

  const searching = debounced.trim().length > 0;

  return (
    <ScreenContainer edges={['top']}>
      <ScreenHeader title={t('title')} hideBack />
      <View style={styles.controls}>
        <SearchInput value={search} onChangeText={setSearch} placeholder={t('search')} testID="history-search" />
        <SegmentedControl<HistoryOrder>
          value={order}
          onChange={setOrder}
          options={[
            { value: 'newest', label: t('sort.newest'), testID: 'sort-newest' },
            { value: 'oldest', label: t('sort.oldest'), testID: 'sort-oldest' },
          ]}
        />
      </View>

      {list.loading && list.items.length === 0 ? (
        <LoadingView />
      ) : list.error && list.items.length === 0 ? (
        <ErrorView message={t('common:errors.loadFailed')} onRetry={list.reload} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => <HistoryItem item={item} colorIndex={index} onPress={open} />}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.list}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={list.loadingMore ? <ActivityIndicator style={styles.more} /> : undefined}
          ListEmptyComponent={
            searching ? (
              <EmptyState icon="search" title={t('noResults')} testID="history-no-results" />
            ) : (
              <EmptyState
                icon="history"
                title={t('empty.title')}
                message={t('empty.message')}
                actionLabel={t('empty.action')}
                onAction={() => router.push('/project/new')}
                testID="history-empty"
              />
            )
          }
        />
      )}
    </ScreenContainer>
  );
}

const Separator = () => <View style={styles.sep} />;

const styles = StyleSheet.create((theme) => ({
  controls: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm, gap: theme.spacing.md },
  list: { padding: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xxxl },
  sep: { height: theme.spacing.md },
  more: { padding: theme.spacing.lg },
}));
