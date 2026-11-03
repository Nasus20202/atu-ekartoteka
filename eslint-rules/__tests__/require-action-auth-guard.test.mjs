import { RuleTester } from 'eslint';

import localRules from '../index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const rule = localRules.rules['require-action-auth-guard'];

ruleTester.run('require-action-auth-guard', rule, {
  valid: [
    {
      code: `'use server';
import { requireAdminAction } from '@/lib/auth/require-action';
export async function renameHoa(id, name) {
  const { denied } = await requireAdminAction();
  if (denied) return denied;
}`,
      filename: 'src/actions/hoa.ts',
    },
    {
      code: `'use server';
import { requireUserAction as guard } from '@/lib/auth/require-action';
export async function save() {
  return guard();
}`,
      filename: 'src/actions/profile.ts',
    },
    {
      // Not a Server Action module.
      code: 'export const value = 1;',
      filename: 'src/lib/utils.ts',
    },
  ],

  invalid: [
    {
      code: `'use server';
export async function renameHoa() {}`,
      filename: 'src/actions/hoa.ts',
      errors: [{ messageId: 'missingGuard' }],
    },
    {
      // Importing the guard is not enough, it must be called.
      code: `'use server';
import { requireAdminAction } from '@/lib/auth/require-action';
export async function renameHoa() {}`,
      filename: 'src/actions/hoa.ts',
      errors: [{ messageId: 'missingGuard' }],
    },
    {
      // A guard from another module does not count.
      code: `'use server';
import { requireAdminAction } from '@/lib/other';
export async function renameHoa() { return requireAdminAction(); }`,
      filename: 'src/actions/hoa.ts',
      errors: [{ messageId: 'missingGuard' }],
    },
    {
      code: `export function Form({ id }) {
  async function save() {
    'use server';
    return id;
  }
  return save;
}`,
      filename: 'src/components/form.tsx',
      errors: [{ messageId: 'inlineAction' }],
    },
  ],
});
