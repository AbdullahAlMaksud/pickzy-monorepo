import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ToastHost } from '@/components/feedback/Toast';
import { ErrorView } from '@/components/ui/ErrorView';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ServicesProvider } from '@/services/ServicesProvider';
import i18n from '@/i18n';
import { useBootstrap } from './useBootstrap';

function RootLayoutContent() {
  const { state, retry } = useBootstrap();
  const { theme } = useUnistyles();
  const { t } = useTranslation('common');

  if (state.status === 'loading') return null; // splash screen is still visible

  if (state.status === 'error') {
    const message =
      state.code === 'newerSchema' ? t('errors.newerSchema') : state.code === 'database' ? t('errors.database') : undefined;
    return (
      <SafeAreaProvider>
        <ScreenContainer>
          <ErrorView title={t('startup.title')} message={message} onRetry={retry} testID="startup-error" />
        </ScreenContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ServicesProvider services={state.services}>
          <StatusBar style={theme.isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="project/new" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
          <ToastHost />
        </ServicesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <RootLayoutContent />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create(() => ({
  root: { flex: 1 },
}));
