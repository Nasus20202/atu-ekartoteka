import { RuleTester } from 'eslint';

import localRules from '../index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('slice-structure', localRules.rules['slice-structure'], {
  valid: [
    { code: 'export {};', filename: 'src/lib/auth/rules/email.ts' },
    { code: 'export {};', filename: 'src/lib/cron/use-cases/init.ts' },
    { code: 'export {};', filename: 'src/lib/shared/iso-string.ts' },
    { code: 'export {};', filename: 'src/lib/platform/logging/logger.ts' },
    { code: 'export {};', filename: 'src/lib/auth/__tests__/email.test.ts' },
    {
      code: 'export {};',
      filename: 'src/lib/import/importers/__tests__/apartments.test.ts',
    },
    { code: 'export {};', filename: 'src/components/import/error-groups.ts' },
  ],

  invalid: [
    {
      code: 'export {};',
      filename: 'src/lib/auth/email.ts',
      errors: [{ messageId: 'looseFile' }],
    },
    {
      code: 'export {};',
      filename: 'src/lib/import/validators.ts',
      errors: [{ messageId: 'looseFile' }],
    },
    {
      code: 'export {};',
      filename: 'src/lib/auth/helpers/email.ts',
      errors: [{ messageId: 'unknownFolder' }],
    },
  ],
});
