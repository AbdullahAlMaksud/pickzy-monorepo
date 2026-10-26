import { useTranslation } from 'react-i18next';
import { LOCALES, type LocaleCode } from '../types';
import { OptionPickerModal, type PickerOption } from './OptionPickerModal';

interface Props {
  visible: boolean;
  value: LocaleCode;
  onClose: () => void;
  onApply: (value: LocaleCode) => void | Promise<void>;
}

export function LanguageSelector({ visible, value, onClose, onApply }: Props) {
  const { t } = useTranslation('profile');
  const options: PickerOption<LocaleCode>[] = LOCALES.map((l) => ({
    value: l,
    title: t(`languages.${l}`),
  }));
  return (
    <OptionPickerModal
      visible={visible}
      title={t('chooseLanguage')}
      options={options}
      value={value}
      onClose={onClose}
      onApply={onApply}
      testID="language-modal"
    />
  );
}
