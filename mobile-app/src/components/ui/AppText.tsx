import { memo } from 'react';
import { Text, type TextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { resolveFontFamily } from '@/theme/typography';
import { lineHeightScale, type FontWeightName } from '@/theme/tokens';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'micro';
export type TextTone =
  | 'text'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'inverse'
  | 'error'
  | 'success'
  | 'warning'
  | 'onPrimary'
  | 'stage'
  | 'stageMuted';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: FontWeightName;
  align?: 'left' | 'center' | 'right';
}

const DEFAULT_WEIGHT: Record<TextVariant, FontWeightName> = {
  display: 'bold',
  title: 'bold',
  heading: 'semibold',
  body: 'regular',
  label: 'medium',
  caption: 'regular',
  micro: 'medium',
};

const FONT_SIZE: Record<TextVariant, number> = {
  display: 30,
  title: 22,
  heading: 18,
  body: 16,
  label: 14,
  caption: 12.5,
  micro: 11,
};

function extractText(children: unknown): string | undefined {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.filter((c) => typeof c === 'string').join('');
  return undefined;
}

function AppTextBase({
  variant = 'body',
  tone = 'text',
  weight,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { i18n } = useTranslation();
  const fontKey = useAppStore((s) => s.preferences.font);
  const locale = i18n.language?.startsWith('bn') ? 'bn' : 'en';
  const resolvedWeight = weight ?? DEFAULT_WEIGHT[variant];
  const fontFamily = resolveFontFamily({
    fontKey,
    locale,
    weight: resolvedWeight,
    text: extractText(children),
    variant,
  });
  const size = FONT_SIZE[variant];
  const lineHeight = Math.round(
    size * (locale === 'bn' ? lineHeightScale.bengali : lineHeightScale.latin),
  );
  styles.useVariants({ tone });
  return (
    <Text
      {...rest}
      style={[styles.base, { fontFamily, fontSize: size, lineHeight }, align && { textAlign: align }, style]}
    >
      {children}
    </Text>
  );
}

export const AppText = memo(AppTextBase);

const styles = StyleSheet.create((theme) => ({
  base: {
    variants: {
      tone: {
        text: { color: theme.colors.text },
        secondary: { color: theme.colors.textSecondary },
        muted: { color: theme.colors.textMuted },
        primary: { color: theme.colors.primary },
        inverse: { color: theme.colors.textInverse },
        error: { color: theme.colors.error },
        success: { color: theme.colors.success },
        warning: { color: theme.colors.warning },
        onPrimary: { color: theme.colors.onPrimary },
        stage: { color: theme.colors.stageText },
        stageMuted: { color: theme.colors.stageTextMuted },
        default: { color: theme.colors.text },
      },
    },
  },
}));
