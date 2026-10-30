'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useServices } from '@/lib/services-context';
import { notifyDataChanged } from '@/store/appStore';
import { toast } from 'sonner';
import { useProjectErrorMessages, type ProjectErrorMessages } from '../hooks/useProjectErrors';
import { ProjectValidationError } from '../services/projectService';
import { ProjectDetailsFields } from './ProjectDetailsFields';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: number; name: string; description: string };
}

export function EditProjectDialog({ open, onOpenChange, project }: EditProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open ? <EditProjectForm project={project} onDone={() => onOpenChange(false)} /> : null}</DialogContent>
    </Dialog>
  );
}

function EditProjectForm({ project, onDone }: { project: EditProjectDialogProps['project']; onDone: () => void }) {
  const { t } = useTranslation(['projects', 'common']);
  const { projects } = useServices();
  const toMessages = useProjectErrorMessages();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [errors, setErrors] = useState<ProjectErrorMessages>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await projects.updateProject(project.id, { name, description });
      notifyDataChanged();
      toast.success(t('projects:manage.updated'));
      onDone();
    } catch (error) {
      if (error instanceof ProjectValidationError) setErrors(toMessages(error.errors));
      else toast.error(t('common:errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t('projects:manage.editProject')}</DialogTitle>
      </DialogHeader>
      <ProjectDetailsFields
        idPrefix="edit-project"
        name={name}
        description={description}
        errors={errors}
        onNameChange={(v) => {
          setName(v);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        onDescriptionChange={setDescription}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('common:cancel')}
        </Button>
        <Button type="submit" disabled={saving}>
          {t('common:save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
