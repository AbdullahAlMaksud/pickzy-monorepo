import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HistoryListItem, HistoryOrder } from '@/database/repositories/historyRepository';
import { useServices } from '@/services/ServicesProvider';
import { useAppStore } from '@/store/appStore';
import { HISTORY_PAGE_SIZE } from '../services/historyService';

/**
 * Paginated history list. Keeps loading pages (30 at a time) as the user scrolls, and restarts from the
 * first page whenever the search text, the sort order or the saved data changes.
 */
export function useHistoryList(search: string, order: HistoryOrder) {
  const { history } = useServices();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [items, setItems] = useState<HistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const request = useRef(0);

  const loadFirst = useCallback(async () => {
    const id = ++request.current;
    try {
      const page = await history.list({ search, order, limit: HISTORY_PAGE_SIZE, offset: 0 });
      if (id !== request.current) return;
      setItems(page);
      setHasMore(page.length === HISTORY_PAGE_SIZE);
      setError(null);
    } catch (e) {
      if (id === request.current) setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [history, search, order]);

  useEffect(() => {
    void loadFirst();
  }, [loadFirst, dataVersion]);

  useFocusEffect(
    useCallback(() => {
      void loadFirst();
    }, [loadFirst]),
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    const id = request.current;
    setLoadingMore(true);
    try {
      const page = await history.list({ search, order, limit: HISTORY_PAGE_SIZE, offset: items.length });
      if (id !== request.current) return;
      setItems((prev) => [...prev, ...page.filter((p) => !prev.some((q) => q.id === p.id))]);
      setHasMore(page.length === HISTORY_PAGE_SIZE);
    } catch {
      // keep what we have; the user can scroll again to retry
    } finally {
      setLoadingMore(false);
    }
  }, [history, search, order, items.length, hasMore, loading, loadingMore]);

  return { items, loading, loadingMore, error, hasMore, loadMore, reload: loadFirst };
}
