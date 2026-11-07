import { memo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppModal } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { MAX_DISPLAY_NAME, normalizeDisplayName } from '../services/preferencesService';

interface EditProfileNameModalProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void | Promise<void>;
  saving?: boolean;
}

function EditProfileNameModalBase({
  visible,
  currentName,
  onClose,
  onSave,
  saving = false,
}: EditProfileNameModalProps) {
  const { t } = useTranslation(['profile', 'common']);
  const [value, setValue] = useState(currentName);
  const [isFocused, setIsFocused] = useState(false);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setValue(currentName);
      setIsFocused(false);
    }
  }

  const handleSave = async () => {
    const clean = normalizeDisplayName(value);
    await onSave(clean);
  };

  const clearInput = () => {
    setValue('');
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      variant="center"
      showClose={false}
      testID="edit-profile-name-modal"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Icon name="pencil" size="sm" color="primary" />
          </View>

          <View style={styles.headerText}>
            <AppText variant="heading" weight="bold" style={styles.title}>
              {t('profile:editName')}
            </AppText>
            <AppText variant="caption" tone="secondary" style={styles.subtitle}>
              {t('profile:enterName')}
            </AppText>
          </View>

          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common:close')}
            style={styles.closeButton}
          >
            <Icon name="x" size="sm" color="textSecondary" />
          </Pressable>
        </View>

        {/* Input Body */}
        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={t('profile:namePlaceholder')}
            placeholderTextColor="#9395A1"
            maxLength={MAX_DISPLAY_NAME}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={styles.input}
            testID="profile-name-input"
          />

          {value.length > 0 ? (
            <Pressable
              onPress={clearInput}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t('common:clearSearch')}
              style={styles.clearButton}
            >
              <Icon name="x" size="xs" color="surface" />
            </Pressable>
          ) : null}
        </View>

        {/* Footer Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={styles.cancelButton}
            testID="cancel-edit-name"
          >
            <AppText variant="label" weight="semibold" style={styles.cancelText}>
              {t('common:cancel')}
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            testID="save-profile"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <AppText variant="label" weight="semibold" style={styles.saveText}>
                {t('common:save')}
              </AppText>
            )}
          </Pressable>
        </View>
      </View>
    </AppModal>
  );
}

export const EditProfileNameModal = memo(EditProfileNameModalBase);

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: theme.colors.text,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: theme.colors.onPrimary,
  },
}));
