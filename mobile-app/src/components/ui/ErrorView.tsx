import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface ErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorView({ title, message, onRetry, testID }: ErrorViewProps) {
  const { t } = useTranslation('common');
  return (
    <View style={styles.container} testID={testID} accessibilityRole="alert">
      <View style={styles.badge}>
        <Icon name="triangle-alert" size="xl" color="error" />
      </View>
      <AppText variant="heading" align="center">
        {title ?? t('errors.generic')}
      </AppText>
      {message ? (
        <AppText tone="secondary" align="center">
          {message}
        </AppText>
      ) : null}
      {onRetry ? <AppButton label={t('tryAgain')} onPress={onRetry} fullWidth={false} compact /> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, padding: theme.spacing.xxl },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
