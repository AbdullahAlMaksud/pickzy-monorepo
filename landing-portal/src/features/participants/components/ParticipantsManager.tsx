'use client';

import { Trash2, Upload } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorState } from '@/components/shared/ErrorState';
import { ListSkeleton } from '@/components/shared/ListSkeleton';
import { useProjectParticipants } from '@/features/projects/hooks/useProjects';
import { useServices } from '@/lib/services-context';
import { notifyDataChanged } from '@/store/appStore';
import { describeBatch } from '../services/batchMessages';
import type { DuplicatePolicy } from '../types';
import { AddNamesForm } from './AddNamesForm';
import { EditNameDialog } from './EditNameDialog';
import { ImportDialog, type ImportReport } from './ImportDialog';
import { ParticipantList, type ParticipantListItem } from './ParticipantList';

/** Add, import, edit, reorder and remove the people in a saved project. */
export function ParticipantsManager({ projectId }: { projectId: number }) {
  const { t } = useTranslation(['projects', 'common']);
  const { participants } = useServices();
  const { data, loading, error, reload } = useProjectParticipants(projectId);
  const [policy, setPolicy] = useState<DuplicatePolicy>('keep');
  const [message, setMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const items = useMemo<ParticipantListItem[]>(() => (data ?? []).map((p) => ({ key: String(p.id), name: p.displayName })), [data]);
  const existingNames = useMemo(() => items.map((i) => i.name), [items]);
  const editingName = items.find((i) => i.key === editingKey)?.name ?? null;

  const run = useCallback(
    async (work: () => Promise<void>): Promise<boolean> => {
      try {
        await work();
        notifyDataChanged();
        return true;
      } catch {
        toast.error(t('common:errors.saveFailed'));
        return false;
      }
    },
    [t],
  );

  const handleAdd = useCallback(
    (names: string[], blankSkipped: number) =>
      run(async () => {
        const result = await participants.addNames(projectId, names, policy);
        setMessage(describeBatch(t, result.inserted, { ...result, blankSkipped: result.blankSkipped + blankSkipped }));
      }),
    [participants, projectId, policy, run, t],
  );

  const handleImport = useCallback(
    (names: string[], report: ImportReport) =>
      run(async () => {
        const result = await participants.addNames(projectId, names, 'keep');
        setMessage(describeBatch(t, result.inserted, { ...report, truncated: report.truncated + result.truncated }));
      }),
    [participants, projectId, run, t],
  );

  if (error && !data) return <ErrorState onRetry={reload} />;
  if (loading && !data) return <ListSkeleton rows={4} />;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('manage.addTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddNamesForm policy={policy} onPolicyChange={setPolicy} onAdd={handleAdd} message={message}>
            <Button variant="outline" className="w-fit" onClick={() => setImportOpen(true)} data-testid="open-import">
              <Upload aria-hidden />
              {t('manage.importMore')}
            </Button>
          </AddNamesForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t('add.listTitle', { count: items.length })}</CardTitle>
          {items.length > 0 ? (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmClear(true)} data-testid="clear-all">
              <Trash2 aria-hidden />
              {t('add.clearAll')}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">{t('manage.drawNote')}</p>
          <ParticipantList
            items={items}
            onEdit={setEditingKey}
            onRemove={(key) => void run(async () => void (await participants.remove(projectId, [Number(key)])))}
            onMove={(key, direction) => void run(() => participants.move(projectId, Number(key), direction))}
          />
        </CardContent>
      </Card>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingNames={existingNames}
        policy={policy}
        onPolicyChange={setPolicy}
        onConfirm={(names, report) => void handleImport(names, report)}
      />
      <EditNameDialog
        name={editingName}
        onClose={() => setEditingKey(null)}
        onSave={async (name) => {
          const ok = await run(() => participants.rename(projectId, Number(editingKey), name));
          if (ok) toast.success(t('manage.renamed'));
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title={t('manage.clearListTitle')}
        description={t('manage.clearListMessage')}
        confirmLabel={t('add.clearAllConfirm')}
        destructive
        onConfirm={async () => {
          if (await run(async () => void (await participants.clear(projectId)))) toast.success(t('manage.cleared'));
        }}
      />
    </div>
  );
}
