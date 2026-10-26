import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppModal } from '@/components/ui/AppModal';
import { ProjectDetailsForm } from './ProjectDetailsForm';
import { hasErrors, validateProject, type ProjectErrors } from '../validation';

interface Props {
  visible: boolean;
  initialName: string;
  initialDescription: string;
  onClose: () => void;
  onSave: (input: { name: string; description: string }) => Promise<void>;
  onDelete: () => void;
}

function EditProjectModalBase({ visible, initialName, initialDescription, onClose, onSave, onDelete }: Props) {
  const { t } = useTranslation(['projects', 'common']);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [errors, setErrors] = useState<ProjectErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setDescription(initialDescription);
      setErrors({});
    }
  }, [visible, initialName, initialDescription]);

  const submit = async () => {
    const found = validateProject({ name, description });
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    try {
      await onSave({ name, description });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal visible={visible} onClose={onClose} title={t('projects:manage.editProject')} variant="sheet">
      <View style={styles.body}>
        <ProjectDetailsForm name={name} description={description} errors={errors} onNameChange={setName} onDescriptionChange={setDescription} />
        <AppButton label={t('common:save')} loading={saving} onPress={submit} testID="edit-project-save" />
        <AppButton label={t('projects:manage.deleteProject')} variant="destructive" icon="trash-2" onPress={onDelete} testID="delete-project" />
      </View>
    </AppModal>
  );
}

export const EditProjectModal = memo(EditProjectModalBase);

const styles = StyleSheet.create((theme) => ({
  body: { gap: theme.spacing.lg },
}));
