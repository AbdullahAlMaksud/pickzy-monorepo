import { Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { OptionPickerModal, type PickerOption } from './OptionPickerModal';
import { FONT_SIZE_PREFERENCES, type FontSizePreference } from '../types';

interface Props {
  visible: boolean;
  value: FontSizePreference;
  onClose: () => void;
  onApply: (value: FontSizePreference) => void | Promise<void>;
}

const SAMPLE_SIZE: Record<FontSizePreference, number> = {
  small: 16,
  medium: 20,
  large: 26,
};

export function FontSizeSelector({ visible, value, onClose, onApply }: Props) {
  const { t } = useTranslation('profile');
  const options: PickerOption<FontSizePreference>[] = FONT_SIZE_PREFERENCES.map((p) => ({
    value: p,
    title: t(`fontSizes.${p}.name`),
    subtitle: t(`fontSizes.${p}.hint`),
    leading: (
      <Text style={[styles.sample, { fontSize: SAMPLE_SIZE[p] }]}>
        Aa
      </Text>
    ),
  }));

  return (
    <OptionPickerModal
      visible={visible}
      title={t('chooseFontSize')}
      options={options}
      value={value}
      onClose={onClose}
      onApply={onApply}
      testID="font-size-modal"
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  sample: {
    width: 44,
    textAlign: 'center',
    color: theme.colors.text,
    fontWeight: '600',
  },
}));

