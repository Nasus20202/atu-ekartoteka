/**
 * Import boundaries shared by the whole tree: the @ alias, the framework edge,
 * the read/write seam and the database client. Kept beside the local rules so
 * the ESLint config stays within the module size limit.
 *
 * Flat config replaces a rule's options for every block that matches a file,
 * so the blocks below cover disjoint file sets, or a later block repeats the
 * earlier patterns it needs.
 */

const TEST_FILES = ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'];

// Relative imports hide the module's place in the tree; the @ alias does not.
export const RELATIVE_IMPORTS = {
  group: ['../*', './*'],
  message:
    'Relative imports are not allowed. Use @ alias instead (e.g., @/components/...).',
};

// Domain modules stay runnable outside Next.js: framework glue lives in
// src/lib/framework (and src/app).
const FRAMEWORK_IMPORTS = {
  group: ['next', 'next/*', 'next-auth', 'next-auth/*', 'react', 'react-dom'],
  message:
    'Domain code must not import the framework. Next.js, React and Auth.js glue belongs in src/lib/framework/ or src/app/.',
};

// Reads may go straight to a query module; writes go through an action.
const MUTATION_IMPORTS = {
  group: ['@/lib/*/mutations/*'],
  message:
    'Reads may call src/lib/<domain>/queries; writes go through a Server Action or a use case.',
};

// Requests reach the database only through the data layer.
const DATABASE_CLIENT_IMPORTS = {
  group: ['@/lib/platform/database/prisma'],
  message:
    'The database client is used only in src/lib/<domain>/queries, src/lib/<domain>/mutations and the infrastructure that owns it.',
};

const LAYER_RULE = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
});

// Modules that own the database client: the seam, transactions and the
// infrastructure that runs outside a request (cron, metrics, health).
const DATABASE_OWNERS = [
  'src/lib/*/queries/**',
  'src/lib/*/mutations/**',
  'src/lib/platform/database/**',
  'src/lib/import/**',
  'src/lib/cron/**',
  'src/lib/platform/opentelemetry/**',
];

export const boundaryConfigs = [
  // A domain module must not import next/*, next-auth or React: those APIs only
  // exist inside a request or a render. React Email templates are exempt,
  // they are rendering by nature.
  {
    files: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
    ignores: [
      'src/lib/framework/**',
      'src/lib/platform/email/**',
      ...TEST_FILES,
    ],
    rules: LAYER_RULE([RELATIVE_IMPORTS, FRAMEWORK_IMPORTS]),
  },
  {
    files: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
    ignores: [
      'src/lib/framework/**',
      'src/lib/platform/email/**',
      ...DATABASE_OWNERS,
      ...TEST_FILES,
    ],
    rules: LAYER_RULE([
      RELATIVE_IMPORTS,
      FRAMEWORK_IMPORTS,
      DATABASE_CLIENT_IMPORTS,
    ]),
  },
  // A component may render data it read from a query; a write must go through a
  // Server Action (or the admin import route), never straight to a mutation or
  // the database client.
  {
    files: [
      'src/app/**/*.ts',
      'src/app/**/*.tsx',
      'src/components/**/*.ts',
      'src/components/**/*.tsx',
    ],
    ignores: ['src/app/api/health/**', ...TEST_FILES],
    rules: LAYER_RULE([
      RELATIVE_IMPORTS,
      MUTATION_IMPORTS,
      DATABASE_CLIENT_IMPORTS,
    ]),
  },
  // Health checks probe the database themselves.
  {
    files: ['src/app/api/health/**/*.ts'],
    ignores: TEST_FILES,
    rules: LAYER_RULE([RELATIVE_IMPORTS, MUTATION_IMPORTS]),
  },
  // Server Actions write through mutations and read through queries, never
  // through the client.
  {
    files: ['src/actions/**/*.ts'],
    ignores: TEST_FILES,
    rules: LAYER_RULE([RELATIVE_IMPORTS, DATABASE_CLIENT_IMPORTS]),
  },
];
