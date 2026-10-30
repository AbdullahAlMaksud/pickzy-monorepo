'use client';

import { Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DuplicatePolicyToggle } from './DuplicatePolicyToggle';
import { splitMultilineNames } from '../services/participantNormalization';
import type { DuplicatePolicy } from '../types';

interface AddNamesFormProps {
  policy: DuplicatePolicy;
  onPolicyChange: (policy: DuplicatePolicy) => void;
  /** Receives the typed names (one per line) and how many blank lines were ignored. Return false to keep the text. */
  onAdd: (names: string[], blankSkipped: number) => boolean | void | Promise<boolean | void>;
  /** The result line shown under the field, e.g. "Added 2 names · 1 duplicates skipped". */
  message?: string | null;
  /** Extra controls (e.g. the import button). */
  children?: ReactNode;
}

/** Quick-add field: one name, or several names separated by new lines. */
export function AddNamesForm({ policy, onPolicyChange, onAdd, message, children }: AddNamesFormProps) {
  const { t } = useTranslation('projects');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const { names, blankSkipped } = splitMultilineNames(text);
    if (names.length === 0) {
      setError(t('add.emptyName'));
      return;
    }
    setBusy(true);
    try {
      const keep = await onAdd(names, blankSkipped);
      if (keep !== false) {
        setText('');
        setError(undefined);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex items-start gap-2">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(undefined);
            }}
            onKeyDown={(e) => {
              // Ctrl/Cmd + Enter adds the names; plain Enter inserts a new line for the next name.
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={t('add.placeholder')}
            aria-label={t('add.placeholder')}
            aria-invalid={!!error}
            aria-describedby={error ? 'add-names-error' : undefined}
            rows={2}
            data-testid="add-names-input"
          />
          <Button type="button" onClick={() => void submit()} disabled={busy} data-testid="add-names-button">
            <Plus aria-hidden />
            {t('add.button')}
          </Button>
        </div>
        {error ? (
          <p id="add-names-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('add.multiHint')}</p>
        )}
      </div>
      <DuplicatePolicyToggle value={policy} onChange={onPolicyChange} />
      {message ? (
        <p role="status" className="text-sm font-medium text-success" data-testid="add-names-message">
          {message}
        </p>
      ) : null}
      {children}
    </div>
  );
}
