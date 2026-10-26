import { useCallback, useRef, useState } from 'react';
import { applyDuplicatePolicy, normalizeName, clampName } from '../services/participantNormalization';
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

/** In-memory participant list for the "New project" form (nothing is saved until the project is created). */
export function useDraftParticipants() {
  const [items, setItems] = useState<DraftParticipant[]>([]);
  const counter = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const add = useCallback(
    (
      names: readonly string[],
      policy: DuplicatePolicy,
      blankSkipped = 0,
    ): Omit<NameBatchResult, 'names'> & { added: number } => {
      const applied = applyDuplicatePolicy(
        itemsRef.current.map((i) => i.name),
        names.map(normalizeName).filter(Boolean),
        policy,
      );
      const fresh = applied.names.map((name) => ({ key: `d${++counter.current}`, name }));
      if (fresh.length > 0) setItems((prev) => [...prev, ...fresh]);
      return { ...applied, blankSkipped, added: fresh.length };
    },
    [],
  );

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const rename = useCallback((key: string, name: string) => {
    const clean = clampName(normalizeName(name)).name;
    if (!clean) return;
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, name: clean } : i)));
  }, []);
  const move = useCallback(
    (key: string, direction: 'up' | 'down') => setItems((prev) => moveKey(prev, key, direction)),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  return { items, add, remove, rename, move, clear };
}
