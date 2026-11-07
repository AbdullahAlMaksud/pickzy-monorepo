import Constants from 'expo-constants';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { showToast } from '@/store/toastStore';
import { haptic } from '@/utils/haptics';

interface AppInfoSectionProps {
  version?: string;
  onVersionPress?: () => void;
  onDeveloperPress?: () => void;
  testID?: string;
}

function AppInfoSectionBase({
  version = Constants.expoConfig?.version ?? '1.0.0',
  onVersionPress,
  onDeveloperPress,
  testID = 'section-app-info',
}: AppInfoSectionProps) {
  const { t } = useTranslation(['profile', 'common']);
  const appName = t('common:appName');
  const versionDisplay = `${version} (${appName})`;

  const handleVersionPress = () => {
    haptic.selection();
    if (onVersionPress) {
      onVersionPress();
    } else {
      showToast(`${appName} v${version}`, 'info');
    }
  };

  const handleDeveloperPress = () => {
    haptic.selection();
    if (onDeveloperPress) {
      onDeveloperPress();
    } else {
      showToast(t('profile:developerInfo'), 'info');
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <AppText
        variant="label"
        weight="semibold"
        tone="secondary"
        accessibilityRole="header"
        style={styles.title}
      >
        {t('profile:appInfo')}
      </AppText>

      <View style={styles.card}>
        {/* Row 1: Version */}
        <View style={styles.row}>
          <AppText variant="body" weight="medium" style={styles.label}>
            {t('profile:versionLabel')}
          </AppText>

          <Pressable
            onPress={handleVersionPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${t('profile:versionLabel')}: ${versionDisplay}`}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            testID="btn-app-version"
          >
            <AppText variant="body" weight="medium" tone="secondary" style={styles.versionText}>
              {versionDisplay}
            </AppText>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Row 2: Developer */}
        <View style={styles.row}>
          <AppText variant="body" weight="medium" style={styles.label}>
            {t('profile:developerLabel')}
          </AppText>

          <Pressable
            onPress={handleDeveloperPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${t('profile:developerLabel')}: ${t('profile:developerName')}`}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            testID="btn-developer"
          >
            <AppText variant="body" weight="medium" style={styles.developerText}>
              {t('profile:developerName')}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const AppInfoSection = memo(AppInfoSectionBase);

const styles = StyleSheet.create((theme) => ({
  container: {
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
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 52,
  },
  label: {
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.md,
  },
  button: {
    paddingVertical: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radii.xs,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  versionText: {
    color: theme.colors.textSecondary,
  },
  developerText: {
    color: theme.colors.primary,
  },
}));

