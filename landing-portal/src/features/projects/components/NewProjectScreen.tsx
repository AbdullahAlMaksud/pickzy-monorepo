'use client';

import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddNamesForm } from '@/features/participants/components/AddNamesForm';
import { EditNameDialog } from '@/features/participants/components/EditNameDialog';
import { ImportDialog, type ImportReport } from '@/features/participants/components/ImportDialog';
import { ParticipantList } from '@/features/participants/components/ParticipantList';
import { useDraftParticipants } from '@/features/participants/hooks/useDraftParticipants';
import { describeBatch } from '@/features/participants/services/batchMessages';
import type { DuplicatePolicy } from '@/features/participants/types';
import { useServices } from '@/lib/services-context';
import { notifyDataChanged } from '@/store/appStore';
import { useProjectErrorMessages, type ProjectErrorMessages } from '../hooks/useProjectErrors';
import { ProjectValidationError } from '../services/projectService';
import { hasErrors, validateProject } from '../validation';
import { ProjectDetailsFields } from './ProjectDetailsFields';

/** "New project": details, a draft participant list (typed or imported) and one Create button. */
export function NewProjectScreen() {
  const { t } = useTranslation(['projects', 'common']);
  const router = useRouter();
  const { projects } = useServices();
  const toMessages = useProjectErrorMessages();
  const draft = useDraftParticipants();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [policy, setPolicy] = useState<DuplicatePolicy>('keep');
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProjectErrorMessages>({});
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const count = draft.items.length;
  const editingName = draft.items.find((i) => i.key === editingKey)?.name ?? null;

  const handleAdd = useCallback(
    (names: string[], blankSkipped: number) => {
      const result = draft.add(names, policy, blankSkipped);
      setMessage(describeBatch(t, result.added, result));
      setErrors((e) => ({ ...e, participants: undefined }));
    },
    [draft, policy, t],
  );

  const handleImport = (names: string[], report: ImportReport) => {
    // The preview already applied the duplicate policy, so add the names as they are.
    const result = draft.add(names, 'keep');
    setMessage(describeBatch(t, result.added, report));
    setErrors((e) => ({ ...e, participants: undefined }));
  };

  const create = async () => {
    const found = validateProject({ name, description }, count);
    setErrors(toMessages(found));
    if (hasErrors(found)) return;
    setSaving(true);
    try {
      const id = await projects.createProject({ name, description, participantNames: draft.items.map((i) => i.name) });
      notifyDataChanged();
      toast.success(t('new.created'));
      router.replace(`/projects/${id}`);
    } catch (error) {
      if (error instanceof ProjectValidationError) setErrors(toMessages(error.errors));
      else toast.error(t('common:errors.saveFailed'));
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title={t('new.title')} backHref="/projects" backLabel={t('common:back')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('new.details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectDetailsFields
                idPrefix="new-project"
                name={name}
                description={description}
                errors={errors}
                onNameChange={(v) => {
                  setName(v);
                  setErrors((e) => ({ ...e, name: undefined }));
                }}
                onDescriptionChange={setDescription}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('new.participantsSection')}</CardTitle>
            </CardHeader>
            <CardContent>
              <AddNamesForm policy={policy} onPolicyChange={setPolicy} onAdd={handleAdd} message={message}>
                <Button variant="outline" className="w-fit" onClick={() => setImportOpen(true)} data-testid="open-import">
                  <Upload aria-hidden />
                  {t('tabs.import')}
                </Button>
              </AddNamesForm>
            </CardContent>
          </Card>
        </div>

        <Card className="content-start">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t('add.listTitle', { count })}</CardTitle>
            {count > 0 ? (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmClear(true)} data-testid="clear-all">
                {t('add.clearAll')}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4">
            {errors.participants ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.participants}
              </p>
            ) : null}
            <ParticipantList items={draft.items} onEdit={setEditingKey} onRemove={draft.remove} onMove={draft.move} />
            <Button size="lg" onClick={() => void create()} disabled={saving} data-testid="create-project">
              {saving ? t('new.creating') : t('new.create', { count })}
            </Button>
          </CardContent>
        </Card>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingNames={draft.items.map((i) => i.name)}
        policy={policy}
        onPolicyChange={setPolicy}
        onConfirm={handleImport}
      />
      <EditNameDialog name={editingName} onClose={() => setEditingKey(null)} onSave={(value) => {
          if (editingKey) draft.rename(editingKey, value);
        }} />
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title={t('add.clearAllTitle')}
        description={t('add.clearAllMessage')}
        confirmLabel={t('add.clearAllConfirm')}
        destructive
        onConfirm={() => draft.clear()}
      />
    </>
  );
}
