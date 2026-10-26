import { memo } from 'react';
import { TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { resolveFontFamily } from '@/theme/typography';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
}

function SearchInputBase({ value, onChangeText, placeholder, testID }: SearchInputProps) {
  const { theme } = useUnistyles();
  const { t, i18n } = useTranslation('common');
  const fontKey = useAppStore((s) => s.preferences.font);
  const locale = i18n.language?.startsWith('bn') ? 'bn' : 'en';
  const fontFamily = resolveFontFamily({ fontKey, locale, weight: 'regular', text: value });
  return (
    <View style={styles.container}>
      <Icon name="search" size="sm" color="textMuted" />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        style={[styles.input, { fontFamily }]}
      />
      {value ? (
        <IconButton
          icon="x"
          size="sm"
          label={t('clearSearch')}
          color="textMuted"
          onPress={() => onChangeText('')}
          style={styles.clear}
        />
      ) : null}
    </View>
  );
}

export const SearchInput = memo(SearchInputBase);

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 46,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.inputBackground,
  },
  input: { flex: 1, fontSize: theme.fontSizes.body, color: theme.colors.text, paddingVertical: 10 },
  clear: { width: 36, height: 36 },
}));
