// Unistyles must be configured before any StyleSheet.create() call runs,
// so the theme module is imported first, then Expo Router takes over.
import './src/theme/unistyles';
import './src/i18n';
import 'expo-router/entry';
