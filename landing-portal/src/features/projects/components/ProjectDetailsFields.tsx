'use client';

import { useTranslation } from 'react-i18next';
import { FormField } from '@/components/shared/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectErrorMessages } from '../hooks/useProjectErrors';
import { MAX_PROJECT_DESCRIPTION, MAX_PROJECT_NAME } from '../validation';

interface ProjectDetailsFieldsProps {
  idPrefix: string;
  name: string;
  description: string;
  errors: ProjectErrorMessages;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

/** The name + description inputs, used by the "new project" form and the edit dialog. */
export function ProjectDetailsFields({ idPrefix, name, description, errors, onNameChange, onDescriptionChange }: ProjectDetailsFieldsProps) {
  const { t } = useTranslation('projects');
  return (
    <div className="grid gap-4">
      <FormField id={`${idPrefix}-name`} label={t('new.name')} error={errors.name}>
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('new.namePlaceholder')}
          maxLength={MAX_PROJECT_NAME * 2}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
          data-testid="project-name-input"
        />
      </FormField>
      <FormField id={`${idPrefix}-description`} label={t('new.description')} error={errors.description}>
        <Textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('new.descriptionPlaceholder')}
          maxLength={MAX_PROJECT_DESCRIPTION * 2}
          rows={2}
          aria-invalid={!!errors.description}
          data-testid="project-description-input"
        />
      </FormField>
    </div>
  );
}
