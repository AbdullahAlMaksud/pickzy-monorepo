import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppModal } from '@/components/ui/AppModal';
import { validateParticipantName } from '../services/participantNormalization';

interface EditNameModalProps {
  visible: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
}

function EditNameModalBase({ visible, initialName, onClose, onSave }: EditNameModalProps) {
  const { t } = useTranslation(['projects', 'common']);
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialName);
      setError(undefined);
      setSaving(false);
    }
  }, [visible, initialName]);

  const submit = async () => {
    const result = validateParticipantName(value);
    if (!result.ok) {
      setError(t('projects:add.emptyName'));
      return;
    }
    setSaving(true);
    try {
      await onSave(result.name);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal visible={visible} onClose={onClose} title={t('projects:manage.editTitle')} variant="center">
      <View style={styles.body}>
        <AppInput
          label={t('projects:manage.editLabel')}
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (error) setError(undefined);
          }}
          error={error}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
          maxLength={120}
          testID="edit-name-input"
        />
        <View style={styles.buttons}>
          <AppButton label={t('common:cancel')} variant="outline" fullWidth={false} style={styles.flex} onPress={onClose} />
          <AppButton label={t('common:save')} fullWidth={false} style={styles.flex} loading={saving} onPress={submit} testID="edit-name-save" />
        </View>
      </View>
    </AppModal>
  );
}

export const EditNameModal = memo(EditNameModalBase);

const styles = StyleSheet.create((theme) => ({
  body: { gap: theme.spacing.lg },
  buttons: { flexDirection: 'row', gap: theme.spacing.md },
  flex: { flex: 1 },
}));
