/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // The first screen test in a cold run compiles many modules; allow for slow CI machines.
  testTimeout: 30000,
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-unistyles|react-native-nitro-modules|@react-native-vector-icons/.*|i18next|react-i18next|zustand))',
  ],
};
