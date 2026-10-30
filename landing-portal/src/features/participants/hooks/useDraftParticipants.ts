'use client';

import { useCallback, useRef, useState } from 'react';
import { applyDuplicatePolicy, clampName, normalizeName } from '../services/participantNormalization';
import type { DraftParticipant, DuplicatePolicy, NameBatchResult } from '../types';

export function moveKey(items: readonly DraftParticipant[], key: string, direction: 'up' | 'down'): DraftParticipant[] {
  const next = [...items];
  const from = next.findIndex((i) => i.key === key);
  if (from < 0) return next;
  const to = direction === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= next.length) return next;
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export type DraftAddResult = Omit<NameBatchResult, 'names'> & { added: number };

/** In-memory participant list for the "New project" form (nothing is saved until the project is created). */
export function useDraftParticipants() {
  const [items, setItems] = useState<DraftParticipant[]>([]);
  // The latest list, readable synchronously from event handlers (state updates are asynchronous).
  const latest = useRef<DraftParticipant[]>([]);
  const counter = useRef(0);

  const commit = useCallback((next: DraftParticipant[]) => {
    latest.current = next;
    setItems(next);
  }, []);

  const add = useCallback(
    (names: readonly string[], policy: DuplicatePolicy, blankSkipped = 0): DraftAddResult => {
      const applied = applyDuplicatePolicy(
        latest.current.map((i) => i.name),
        names.map(normalizeName).filter(Boolean),
        policy,
      );
      const fresh = applied.names.map((name) => ({ key: `d${++counter.current}`, name }));
      if (fresh.length > 0) commit([...latest.current, ...fresh]);
      return { ...applied, blankSkipped, added: fresh.length };
    },
    [commit],
  );

  const remove = useCallback((key: string) => commit(latest.current.filter((i) => i.key !== key)), [commit]);

  const rename = useCallback(
    (key: string, name: string) => {
      const clean = clampName(normalizeName(name)).name;
      if (!clean) return;
      commit(latest.current.map((i) => (i.key === key ? { ...i, name: clean } : i)));
    },
    [commit],
  );

  const move = useCallback(
    (key: string, direction: 'up' | 'down') => commit(moveKey(latest.current, key, direction)),
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);

  return { items, add, remove, rename, move, clear };
}
