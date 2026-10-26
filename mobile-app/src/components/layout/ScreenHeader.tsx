import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '../ui/AppText';
import { IconButton } from '../ui/IconButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Hide the back button (root tab screens). */
  hideBack?: boolean;
  right?: ReactNode;
  tone?: 'default' | 'stage';
}

export function ScreenHeader({ title, subtitle, onBack, hideBack = false, right, tone = 'default' }: ScreenHeaderProps) {
  const { t } = useTranslation('common');
  const stage = tone === 'stage';
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {hideBack ? null : (
          <IconButton
            icon="chevron-left"
            label={t('back')}
            color={stage ? 'stageText' : 'text'}
            onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
            testID="header-back"
          />
        )}
      </View>
      <View style={styles.center}>
        <AppText variant="heading" tone={stage ? 'stage' : 'text'} align="center" numberOfLines={1} accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone={stage ? 'stageMuted' : 'muted'} align="center" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    minHeight: theme.sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  side: { width: theme.sizes.touch * 2 - 8, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xs },
}));
