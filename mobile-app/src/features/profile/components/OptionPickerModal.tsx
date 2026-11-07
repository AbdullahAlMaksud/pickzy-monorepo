import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppModal } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { haptic } from '@/utils/haptics';

export interface PickerOption<T extends string> {
  value: T;
  title: string;
  subtitle?: string;
  /** Leading preview (theme swatch, font sample...). */
  leading?: ReactNode;
  testID?: string;
  titleFontFamily?: string;
  subtitleFontFamily?: string;
}

interface Props<T extends string> {
  visible: boolean;
  title: string;
  options: readonly PickerOption<T>[];
  value: T;
  onClose: () => void;
  /** Called with the chosen value when the user taps Apply. May be async. */
  onApply: (value: T) => void | Promise<void>;
  /** Modal presentation style. Defaults to 'center' (floating modal). */
  variant?: 'sheet' | 'center';
  testID?: string;
}

/** Radio list + Apply button, used by the Theme, Font and Language pickers. */
export function OptionPickerModal<T extends string>({
  visible,
  title,
  options,
  value,
  onClose,
  onApply,
  variant = 'center',
  testID,
}: Props<T>) {
  const { t } = useTranslation('common');
  const [selected, setSelected] = useState<T>(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setSelected(value);
  }, [visible, value]);

  const apply = async () => {
    setBusy(true);
    try {
      await onApply(selected);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppModal visible={visible} onClose={onClose} title={title} variant={variant} testID={testID}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {options.map((option) => {
          const checked = option.value === selected;
          return (
            <Pressable
              key={option.value}
              testID={option.testID ?? `option-${option.value}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: checked }}
              accessibilityLabel={option.subtitle ? `${option.title}, ${option.subtitle}` : option.title}
              onPress={() => {
                haptic.selection();
                setSelected(option.value);
              }}
              style={[styles.row, checked && styles.rowChecked]}
            >
              {option.leading ? <View style={styles.leading}>{option.leading}</View> : null}
              <View style={styles.text}>
                <AppText
                  variant="label"
                  weight="semibold"
                  style={option.titleFontFamily ? { fontFamily: option.titleFontFamily } : undefined}
                >
                  {option.title}
                </AppText>
                {option.subtitle ? (
                  <AppText
                    variant="caption"
                    tone="muted"
                    style={option.subtitleFontFamily ? { fontFamily: option.subtitleFontFamily } : undefined}
                  >
                    {option.subtitle}
                  </AppText>
                ) : null}
              </View>
              <View style={[styles.radio, checked && styles.radioChecked]}>
                {checked ? <View style={styles.dot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <AppButton label={t('apply')} loading={busy} onPress={apply} testID="picker-apply" />
    </AppModal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  list: {
    flexGrow: 0,
    maxHeight: Math.min(340, rt.screen.height * 0.48),
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rowChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySofter,
  },
  leading: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChecked: { borderColor: theme.colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
}));
