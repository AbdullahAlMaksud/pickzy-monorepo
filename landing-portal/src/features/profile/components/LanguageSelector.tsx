'use client';

import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LOCALES, type LocaleCode } from '../types';

interface LanguageSelectorProps {
  id: string;
  value: LocaleCode;
  onChange: (locale: LocaleCode) => void;
}

export function LanguageSelector({ id, value, onChange }: LanguageSelectorProps) {
  const { t } = useTranslation('profile');
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LocaleCode)}>
      <SelectTrigger id={id} className="w-40" data-testid="language-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((code) => (
          <SelectItem key={code} value={code}>
            {t(`languages.${code}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
