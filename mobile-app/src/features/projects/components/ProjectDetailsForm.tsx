import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppInput } from '@/components/ui/AppInput';
import { useLocale } from '@/hooks/useLocale';
import { MAX_PROJECT_DESCRIPTION, MAX_PROJECT_NAME, type ProjectErrors } from '../validation';

interface Props {
  name: string;
  description: string;
  errors: ProjectErrors;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

function ProjectDetailsFormBase({ name, description, errors, onNameChange, onDescriptionChange }: Props) {
  const { t } = useTranslation('projects');
  const { number } = useLocale();
  const nameError = errors.name
    ? errors.name === 'REQUIRED'
      ? t('validation.nameRequired')
      : t('validation.nameTooLong', { max: MAX_PROJECT_NAME })
    : undefined;
  const descError = errors.description ? t('validation.descriptionTooLong', { max: MAX_PROJECT_DESCRIPTION }) : undefined;
  return (
    <View style={styles.wrapper}>
      <AppInput
        label={t('new.name')}
        value={name}
        onChangeText={onNameChange}
        placeholder={t('new.namePlaceholder')}
        error={nameError}
        counter={`${number(Array.from(name).length)}/${number(MAX_PROJECT_NAME)}`}
        returnKeyType="next"
        testID="project-name-input"
      />
      <AppInput
        label={t('new.description')}
        value={description}
        onChangeText={onDescriptionChange}
        placeholder={t('new.descriptionPlaceholder')}
        error={descError}
        counter={`${number(Array.from(description).length)}/${number(MAX_PROJECT_DESCRIPTION)}`}
        multiline
        multilineMinHeight={72}
        testID="project-description-input"
      />
    </View>
  );
}

export const ProjectDetailsForm = memo(ProjectDetailsFormBase);

const styles = StyleSheet.create((theme) => ({
  wrapper: { gap: theme.spacing.md },
}));
