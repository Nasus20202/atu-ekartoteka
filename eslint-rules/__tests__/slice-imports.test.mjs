import { RuleTester } from 'eslint';

import localRules from '../index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const useCase = 'src/lib/users/use-cases/update-user-status.ts';
const query = 'src/lib/users/queries/find-user.ts';

function imports(source) {
  return `import { x } from '${source}';`;
}

ruleTester.run('slice-imports', localRules.rules['slice-imports'], {
  valid: [
    { code: imports('@/lib/users/queries/find-user'), filename: useCase },
    { code: imports('@/lib/auth/queries/has-admin-access'), filename: useCase },
    {
      code: imports('@/lib/import/importers'),
      filename: 'src/lib/import/use-cases/validate-database.ts',
    },
    {
      code: imports('@/lib/import/types/import-error'),
      filename: 'src/lib/import/pipeline/parse-hoa-files.ts',
    },
    {
      code: imports('@/lib/auth/types/account'),
      filename: 'src/lib/auth/types/turnstile.ts',
    },
    {
      code: imports('@/lib/platform/logging/logger'),
      filename: 'src/lib/auth/rules/email.ts',
    },
    {
      code: imports('@/lib/shared/utils/decimal'),
      filename: 'src/lib/charges/types/charge.ts',
    },
    {
      code: imports('@/lib/payments/types/monthly-charge-sums'),
      filename: 'src/lib/shared/utils/payment-balances.ts',
    },
    {
      code: imports('@/lib/users/queries/find-user'),
      filename: 'src/components/users/user-row.tsx',
    },
    {
      code: imports('@/lib/users/types/user'),
      filename: 'src/components/users/user-row.tsx',
    },
    { code: imports('next/navigation'), filename: 'src/app/page.tsx' },
    {
      code: imports('@/lib/users/use-cases/account-status'),
      filename: 'src/actions/users/bulk.ts',
    },
    {
      code: imports('@/lib/users/use-cases/account-status'),
      filename: 'src/lib/auth/use-cases/x.ts',
    },
    {
      code: imports('@/lib/users/use-cases/account-status'),
      filename: 'src/lib/auth/__tests__/x.test.ts',
    },
  ],

  invalid: [
    {
      code: imports('@/lib/users/use-cases/update-user-status'),
      filename: 'src/lib/users/types/user.ts',
      errors: [{ messageId: 'layer' }],
    },
    {
      code: imports('@/lib/users/use-cases/update-user-status'),
      filename: query,
      errors: [{ messageId: 'layer' }],
    },
    {
      code: imports('@/lib/auth/queries/has-admin-access'),
      filename: 'src/lib/auth/rules/admin-access.ts',
      errors: [{ messageId: 'layer' }],
    },
    {
      code: imports('@/lib/import/use-cases/validate-database'),
      filename: 'src/lib/import/pipeline/balance.ts',
      errors: [{ messageId: 'layer' }],
    },
    {
      code: "export { x } from '@/lib/users/use-cases/update-user-status';",
      filename: 'src/lib/users/dto/user-dto.ts',
      errors: [{ messageId: 'layer' }],
    },
    {
      code: imports('@/lib/platform/database/prisma'),
      filename: 'src/lib/auth/rules/email.ts',
      errors: [{ messageId: 'platform' }],
    },
    {
      code: imports('@/lib/framework/auth/require-admin'),
      filename: useCase,
      errors: [{ messageId: 'framework' }],
    },
    {
      code: imports('@/lib/auth/email'),
      filename: useCase,
      errors: [{ messageId: 'rootFile' }],
    },
    {
      code: imports('@/lib/users/use-cases/update-user-status'),
      filename: 'src/components/users/user-row.tsx',
      errors: [{ messageId: 'components' }],
    },
    {
      code: imports('@/lib/users/queries/find-user'),
      filename: 'src/lib/shared/utils/helper.ts',
      errors: [{ messageId: 'shared' }],
    },
  ],
});
