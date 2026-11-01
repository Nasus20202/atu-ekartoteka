import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import playwright from 'eslint-plugin-playwright';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

import localRules from './eslint-rules/index.mjs';

const eslintConfig = defineConfig([
  ...fixupConfigRules(nextVitals),
  ...fixupConfigRules(nextTs),
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
      import: fixupPluginRules(importPlugin),
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'prettier/prettier': 'error',

      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Remove unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Prevent duplicate imports and merge them
      'import/no-duplicates': ['error', { 'prefer-inline': true }],

      // Keep modules small; blank lines and comments are not counted
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],

      // Forbid relative imports - enforce @ alias
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', './*'],
              message:
                'Relative imports are not allowed. Use @ alias instead (e.g., @/components/...).',
            },
          ],
        },
      ],
    },
  },
  // Fields prefixed with `legacy` hold values loaded from the input files that
  // are known to be incorrect; only import code and tests may touch them
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Identifier[name=/^legacy/]',
          message:
            'Identifiers starting with "legacy" hold incorrect imported values. Use the figures derived from Charge records instead.',
        },
      ],
    },
  },
  {
    files: [
      'src/lib/import/**',
      'src/lib/queries/payments/**',
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // Allow 'any' type in test files
  {
    files: [
      '**/__tests__/**/*.ts',
      '**/__tests__/**/*.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Test files may grow beyond the module size limit
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', 'e2e/**/*.ts'],
    rules: {
      'max-lines': 'off',
    },
  },
  // E2E tests - Playwright ESLint rules
  {
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'no-restricted-imports': 'off',
      'react-hooks/rules-of-hooks': 'off',
      // Playwright-specific rules
      'playwright/expect-expect': 'error',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/valid-expect': 'error',
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/no-force-option': 'warn',
    },
  },
  // Performance tests - k6 scripts and their seed run outside the @ alias
  {
    files: ['perf/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // Access checks go through the shared predicates; the comparison itself lives
  // in the predicate modules so a change of policy cannot miss a call site.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: [
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      'src/lib/auth/account-access.ts',
      'src/lib/auth/admin-access.ts',
    ],
    plugins: { local: localRules },
    rules: {
      'local/prefer-access-helpers': 'error',
    },
  },
  // Raw SQL bypasses the Prisma query API and is only allowed in migrations.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    plugins: { local: localRules },
    rules: {
      'local/no-raw-sql': 'error',
    },
  },
  // Local rule modules and their tests are loaded by path, not through the alias.
  {
    files: ['eslint-rules/**', 'eslint.config.mjs'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // Repo-level check: it runs once, on the lint config, and reports any
  // OpenSpec change that still lives outside `openspec/changes/archive/`.
  {
    files: ['eslint.config.mjs'],
    plugins: { local: localRules },
    rules: {
      'local/no-unarchived-openspec-changes': 'error',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'src/generated/**',
    'playwright-report/**',
    'coverage/**',
    '.opencode/**',
  ]),
]);

export default eslintConfig;
