import localRules from './index.mjs';

// Slice shape and layer matrix for the application code. Tests are exempt:
// they wire mocks across layers on purpose.
export const sliceConfigs = [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    plugins: { local: localRules },
    rules: {
      'local/slice-structure': 'error',
      'local/slice-imports': 'error',
    },
  },
];
