import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';

export function LoadingView({ label }: { label?: string }) {
  const { theme } = useUnistyles();
  const { t } = useTranslation('common');
  const text = label ?? t('loading');
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={text}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <AppText variant="caption" tone="muted">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, padding: theme.spacing.xxl },
}));
