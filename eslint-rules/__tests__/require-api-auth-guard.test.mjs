import { RuleTester } from 'eslint';

import localRules from '../index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const rule = localRules.rules['require-api-auth-guard'];

ruleTester.run('require-api-auth-guard', rule, {
  valid: [
    {
      code: "import { requireUser } from '@/lib/auth/require-user';",
      filename: 'src/app/api/user/profile/route.ts',
    },
    {
      code: "import { requireAdmin } from '@/lib/auth/require-admin';",
      filename: 'src/app/api/admin/users/route.ts',
    },
    {
      code: "import { auth } from '@/auth';",
      filename: 'src/app/api/auth/[...nextauth]/route.ts',
    },
    {
      code: 'export async function GET() { return new Response(); }',
      filename: 'src/app/api/health/route.ts',
    },
    {
      code: 'export async function POST() {}',
      filename: 'src/app/api/register/route.ts',
    },
    {
      // Not an API route module.
      code: 'export const value = 1;',
      filename: 'src/lib/auth/providers.ts',
    },
  ],

  invalid: [
    {
      code: 'export async function GET() { return Response.json({}); }',
      filename: 'src/app/api/reports/route.ts',
      errors: [{ messageId: 'missingGuard' }],
    },
    {
      code: 'export async function POST() {}',
      filename: '/home/dev/project/src/app/api/reports/monthly/route.ts',
      errors: [{ messageId: 'missingGuard' }],
    },
  ],
});
