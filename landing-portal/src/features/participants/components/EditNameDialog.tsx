'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { MAX_NAME_LENGTH, normalizeName } from '../services/participantNormalization';

interface EditNameDialogProps {
  /** The name being edited, or null when closed. */
  name: string | null;
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
}

export function EditNameDialog({ name, onClose, onSave }: EditNameDialogProps) {
  return (
    <Dialog open={name !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {/* Remounted per name so the field always starts from the current value. */}
        {name !== null ? <EditNameForm key={name} initial={name} onSave={onSave} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EditNameForm({ initial, onSave, onClose }: { initial: string; onSave: EditNameDialogProps['onSave']; onClose: () => void }) {
  const { t } = useTranslation(['projects', 'common']);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizeName(value)) {
      setError(t('projects:add.emptyName'));
      return;
    }
    setSaving(true);
    try {
      await onSave(value);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t('projects:manage.editTitle')}</DialogTitle>
      </DialogHeader>
      <FormField id="edit-name" label={t('projects:manage.editLabel')} error={error}>
        <Input
          id="edit-name"
          value={value}
          maxLength={MAX_NAME_LENGTH * 2}
          onChange={(e) => {
            setValue(e.target.value);
            setError(undefined);
          }}
          autoFocus
          aria-invalid={!!error}
          data-testid="edit-name-input"
        />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common:cancel')}
        </Button>
        <Button type="submit" disabled={saving} data-testid="edit-name-save">
          {t('common:save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
