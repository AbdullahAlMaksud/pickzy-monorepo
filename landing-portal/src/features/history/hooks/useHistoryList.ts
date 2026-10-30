'use client';

import { useCallback, useState } from 'react';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import type { HistoryOrder } from '@/lib/db/repositories/historyRepository';
import { HISTORY_PAGE_SIZE } from '../services/historyService';

/**
 * Completed draws, newest first by default. "Load more" grows the page by 30 items; changing the
 * search or the sort goes back to the first page.
 */
export function useHistoryList(search: string, order: HistoryOrder) {
  const [pages, setPages] = useState({ key: '', count: 1 });
  const key = `${search}\u0000${order}`;
  const count = pages.key === key ? pages.count : 1;
  const limit = count * HISTORY_PAGE_SIZE;

  const query = useAsyncQuery((s) => s.history.list({ search, order, limit }), [search, order, limit]);
  const hasMore = !!query.data && query.data.length >= limit;
  const loadMore = useCallback(() => setPages({ key, count: count + 1 }), [key, count]);

  return { ...query, hasMore, loadMore };
}
