import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui';
import { haptic } from '@/utils/haptics';
import type { LocaleCode } from '../types';

interface LanguageOption {
  code: LocaleCode;
  badge: string;
}

const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'bn', badge: 'BN' },
  { code: 'en', badge: 'EN' },
];

interface LanguageSectionProps {
  currentLocale?: LocaleCode;
  onSelectLocale?: (locale: LocaleCode) => void | Promise<void>;
  testID?: string;
}

export function LanguageSection({
  currentLocale,
  onSelectLocale,
  testID = 'section-language',
}: LanguageSectionProps) {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const activeLocale: LocaleCode = (
    currentLocale ?? (i18n.language?.startsWith('bn') ? 'bn' : 'en')
  ) as LocaleCode;

  const handleSelect = useCallback(
    async (code: LocaleCode) => {
      if (code === activeLocale) return;
      haptic.selection();
      await i18n.changeLanguage(code);
      if (onSelectLocale) {
        await onSelectLocale(code);
      }
    },
    [activeLocale, i18n, onSelectLocale],
  );

  return (
    <View style={styles.wrapper} testID={testID} accessibilityRole="radiogroup">
      <AppText
        variant="label"
        weight="semibold"
        tone="secondary"
        accessibilityRole="header"
        style={styles.title}
      >
        {t('profile:appLanguage')}
      </AppText>

      <View style={styles.card}>
        {LANGUAGE_OPTIONS.map((option, index) => {
          const isSelected = activeLocale === option.code;
          const optionTitle = t(`profile:languages.${option.code}`);
          const optionSubtitle = t(`profile:languageSubtitles.${option.code}`);

          return (
            <View key={option.code}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                testID={`option-${option.code}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${optionTitle}, ${optionSubtitle}`}
                onPress={() => void handleSelect(option.code)}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  <AppText
                    variant="caption"
                    weight="bold"
                    style={[styles.badgeText, isSelected && styles.badgeTextSelected]}
                  >
                    {option.badge}
                  </AppText>
                </View>

                <View style={styles.content}>
                  <AppText variant="body" weight="semibold" style={styles.optionTitle}>
                    {optionTitle}
                  </AppText>
                  <AppText variant="caption" tone="secondary" style={styles.optionSubtitle}>
                    {optionSubtitle}
                  </AppText>
                </View>

                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    gap: theme.spacing.sm,
  },
  title: {
    marginStart: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xs,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: 'transparent',
    gap: theme.spacing.md,
  },
  rowSelected: {
    backgroundColor: theme.colors.primarySofter,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: {
    backgroundColor: theme.colors.surface,
  },
  badgeText: {
    color: theme.colors.textSecondary,
  },
  badgeTextSelected: {
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: theme.colors.text,
  },
  optionSubtitle: {
    color: theme.colors.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
}));

