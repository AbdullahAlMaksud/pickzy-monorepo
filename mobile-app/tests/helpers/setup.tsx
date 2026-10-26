// Global Jest setup: Unistyles mock (no native runtime in Jest), Reanimated and native module mocks.
/* eslint-disable @typescript-eslint/no-require-imports */
import 'react-native-unistyles/mocks';
import { StyleSheet } from 'react-native-unistyles';
import { themes } from '@/theme/themes';
import { breakpoints } from '@/theme/tokens';

StyleSheet.configure({
  themes,
  breakpoints,
  settings: { initialTheme: 'light' },
});

jest.mock('react-native-reanimated', () => require('./reanimatedMock').reanimatedMock);
jest.mock('react-native-worklets', () => require('./reanimatedMock').workletsMock);
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('@react-native-vector-icons/lucide/static', () => {
  const { Text } = require('react-native');
  return { Lucide: ({ name }: { name: string }) => <Text>{`icon:${name}`}</Text> };
});

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      navigate: jest.fn(),
      canGoBack: jest.fn(() => true),
    },
    useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]),
    useLocalSearchParams: jest.fn(() => ({})),
  };
});
jest.mock('expo-sqlite', () => ({}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0' } } }));
jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    exists = true;
    constructor(...parts: string[]) {
      this.uri = parts.join('/');
    }
    delete() {}
    async copy() {}
    async bytes() {
      return new Uint8Array();
    }
  }
  class Directory extends File {
    create() {}
  }
  return { File, Directory, Paths: { document: 'file:///documents' } };
});

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useToastStore } = require('@/store/toastStore');
  useToastStore.setState({ current: null });
});
