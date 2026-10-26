import { Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { FONT_OPTIONS, resolveFontFamily, type FontKey } from '@/theme/typography';
import { OptionPickerModal, type PickerOption } from './OptionPickerModal';

interface Props {
  visible: boolean;
  value: FontKey;
  onClose: () => void;
  onApply: (value: FontKey) => void | Promise<void>;
}

export function FontSelector({ visible, value, onClose, onApply }: Props) {
  const { t } = useTranslation('profile');
  const options: PickerOption<FontKey>[] = FONT_OPTIONS.map((f) => ({
    value: f.key,
    title: f.label,
    subtitle: t(`fonts.${f.key}`),
    leading: (
      <Text style={[styles.sample, { fontFamily: resolveFontFamily({ fontKey: f.key, locale: 'en', weight: 'semibold' }) }]}>Aa</Text>
    ),
  }));
  return (
    <OptionPickerModal
      visible={visible}
      title={t('chooseFont')}
      options={options}
      value={value}
      onClose={onClose}
      onApply={onApply}
      testID="font-modal"
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  sample: { width: 44, fontSize: 22, textAlign: 'center', color: theme.colors.text },
}));
