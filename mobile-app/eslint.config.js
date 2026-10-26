const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['node_modules/**', '.expo/**', 'android/**', 'ios/**', 'coverage/**', 'dist/**']),
  expoConfig,
  { rules: { 'import/no-unresolved': 'off' } },
  { files: ['**/*.ts', '**/*.tsx'], rules: { '@typescript-eslint/no-explicit-any': 'error' } },
  {
    // React Compiler heuristics. The flagged patterns (latest-ref, reset-state-when-a-modal-opens,
    // clock read for a greeting) are intentional and safe here, so they are reported as warnings.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
]);
