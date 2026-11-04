import { RuleTester } from 'eslint';

import localRules from '../index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const rule = localRules.rules['require-api-auth-guard'];

ruleTester.run('require-api-auth-guard', rule, {
  valid: [
    {
      code: `import { requireUser } from '@/lib/auth/require-user';
export async function GET() {
  const { response } = await requireUser();
  return response ?? Response.json({});
}`,
      filename: 'src/app/api/user/preferences/route.ts',
    },
    {
      code: `import { requireAdmin } from '@/lib/auth/require-admin';
export async function GET() {
  const { response } = await requireAdmin();
  return response ?? Response.json({});
}`,
      filename: 'src/app/api/admin/users/route.ts',
    },
    {
      code: `import { requireUser as guard } from '@/lib/auth/require-user';
export async function GET() {
  return guard();
}`,
      filename: 'src/app/api/reports/route.ts',
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
    {
      // Imported but never called.
      code: `import { requireUser } from '@/lib/auth/require-user';
export async function GET() { return Response.json({}); }`,
      filename: 'src/app/api/reports/route.ts',
      errors: [{ messageId: 'missingGuard' }],
    },
    {
      // Importing auth directly is not a guard.
      code: `import { auth } from '@/auth';
export async function GET() { return Response.json({}); }`,
      filename: 'src/app/api/reports/route.ts',
      errors: [{ messageId: 'missingGuard' }],
    },
  ],
});
