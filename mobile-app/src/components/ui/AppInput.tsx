import { forwardRef, memo, useState, type ComponentRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { resolveFontFamily } from '@/theme/typography';
import { AppText } from './AppText';

export interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  /** Right-aligned text under the field, e.g. "12/60". */
  counter?: string;
  multilineMinHeight?: number;
}

const AppInputBase = forwardRef<ComponentRef<typeof TextInput>, AppInputProps>(function AppInput(
  { label, error, hint, counter, multiline, multilineMinHeight = 96, onFocus, onBlur, value, ...rest },
  ref,
) {
  const { theme } = useUnistyles();
  const { i18n } = useTranslation();
  const fontKey = useAppStore((s) => s.preferences.font);
  const [focused, setFocused] = useState(false);
  const locale = i18n.language?.startsWith('bn') ? 'bn' : 'en';
  const fontFamily = resolveFontFamily({ fontKey, locale, weight: 'regular', text: value });
  styles.useVariants({ focused, invalid: !!error, multiline: !!multiline });

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="caption" tone="secondary" weight="medium" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        value={value}
        multiline={multiline}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        accessibilityLabel={label ?? rest.placeholder}
        accessibilityHint={error ?? hint}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { fontFamily },
          multiline ? { minHeight: multilineMinHeight, textAlignVertical: 'top' } : null,
        ]}
        {...rest}
      />
      {error || hint || counter ? (
        <View style={styles.footer}>
          <AppText
            variant="caption"
            tone={error ? 'error' : 'muted'}
            style={styles.footerText}
            accessibilityLiveRegion={error ? 'polite' : undefined}
          >
            {error ?? hint ?? ''}
          </AppText>
          {counter ? (
            <AppText variant="caption" tone="muted">
              {counter}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

export const AppInput = memo(AppInputBase);

const styles = StyleSheet.create((theme) => ({
  wrapper: { gap: theme.spacing.xs },
  label: { marginStart: theme.spacing.xs },
  input: {
    minHeight: theme.sizes.input,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSizes.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1.5,
    borderColor: 'transparent',
    variants: {
      focused: { true: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }, false: {} },
      invalid: { true: { borderColor: theme.colors.error }, false: {} },
      multiline: { true: { lineHeight: 22 }, false: {} },
    },
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm },
  footerText: { flex: 1 },
}));
