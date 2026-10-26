import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { themes } from '@/theme/themes';
import { THEME_PREFERENCES, type ThemePreference } from '../types';
import { OptionPickerModal, type PickerOption } from './OptionPickerModal';

function Swatch({ preference }: { preference: ThemePreference }) {
  const light = themes.light.colors;
  const dark = themes.dark.colors;
  const [left, right] =
    preference === 'system'
      ? [light, dark]
      : preference === 'light'
        ? [light, light]
        : preference === 'dark'
          ? [dark, dark]
          : [themes.colorful.colors, themes.colorful.colors];
  return (
    <View style={styles.swatch}>
      <View style={[styles.half, { backgroundColor: left.background }]}>
        <View style={[styles.bar, { backgroundColor: left.primary }]} />
      </View>
      <View style={[styles.half, { backgroundColor: right.background }]}>
        <View style={[styles.bar, { backgroundColor: right.primary }]} />
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  value: ThemePreference;
  onClose: () => void;
  onApply: (value: ThemePreference) => void | Promise<void>;
}

export function ThemeSelector({ visible, value, onClose, onApply }: Props) {
  const { t } = useTranslation('profile');
  const options: PickerOption<ThemePreference>[] = THEME_PREFERENCES.map((p) => ({
    value: p,
    title: t(`themes.${p}.name`),
    subtitle: t(`themes.${p}.hint`),
    leading: <Swatch preference={p} />,
  }));
  return <OptionPickerModal visible={visible} title={t('chooseTheme')} options={options} value={value} onClose={onClose} onApply={onApply} testID="theme-modal" />;
}

const styles = StyleSheet.create((theme) => ({
  swatch: {
    width: 56,
    height: 40,
    flexDirection: 'row',
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  half: { flex: 1, justifyContent: 'flex-end', padding: 4 },
  bar: { height: 6, borderRadius: 3 },
}));
