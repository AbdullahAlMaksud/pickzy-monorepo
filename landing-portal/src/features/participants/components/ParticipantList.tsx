'use client';

import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { SearchInput } from '@/components/shared/SearchInput';
import { useLocale } from '@/hooks/useLocale';

export interface ParticipantListItem {
  /** Stable key: the database id (as text) for saved people, a local key for drafts. */
  key: string;
  name: string;
}

interface ParticipantListProps {
  items: readonly ParticipantListItem[];
  onEdit: (key: string) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: 'up' | 'down') => void;
}

const PAGE = 100;
/** Searching and reordering are only useful for longer lists. */
const SEARCH_FROM = 8;

/**
 * The editable list of names, shared by the "new project" form and the project page.
 * Long lists are shown in pages of {@link PAGE} so thousands of names stay fast.
 */
function ParticipantListBase({ items, onEdit, onRemove, onMove }: ParticipantListProps) {
  const { t } = useTranslation('projects');
  const { number } = useLocale();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const needle = search.trim().toLowerCase();
  const filtered = useMemo(
    () => (needle ? items.filter((i) => i.name.toLowerCase().includes(needle)) : items),
    [items, needle],
  );
  const shown = filtered.slice(0, limit);
  const reorderable = !needle; // moving inside a filtered view would be confusing

  return (
    <div className="grid gap-3">
      {items.length >= SEARCH_FROM ? (
        <SearchInput value={search} onChange={(v) => { setSearch(v); setLimit(PAGE); }} placeholder={t('add.searchPlaceholder')} testId="participant-search" />
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">{t('add.empty')}</p>
      ) : filtered.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">{t('add.noMatches')}</p>
      ) : (
        <ul className="divide-y rounded-lg border" data-testid="participant-list">
          {shown.map((item) => {
            const index = items.indexOf(item);
            return (
              <li key={item.key} className="flex items-center gap-3 p-2 pl-3 [content-visibility:auto]">
                <PersonAvatar name={item.name} colorIndex={index} />
                <span className="min-w-0 flex-1 truncate" title={item.name}>
                  {item.name}
                </span>
                {reorderable ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === 0}
                      onClick={() => onMove(item.key, 'up')}
                      aria-label={t('manage.moveUp', { name: item.name })}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === items.length - 1}
                      onClick={() => onMove(item.key, 'down')}
                      aria-label={t('manage.moveDown', { name: item.name })}
                    >
                      <ArrowDown />
                    </Button>
                  </>
                ) : null}
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item.key)} aria-label={t('add.editOne', { name: item.name })}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(item.key)}
                  aria-label={t('add.removeOne', { name: item.name })}
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > shown.length ? (
        <Button variant="outline" onClick={() => setLimit((n) => n + PAGE)}>
          {t('import.moreRows', { count: filtered.length - shown.length })}
        </Button>
      ) : null}
      {needle ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {number(filtered.length)} / {number(items.length)}
        </p>
      ) : null}
    </div>
  );
}

export const ParticipantList = memo(ParticipantListBase);
