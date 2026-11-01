import { RuleTester } from 'eslint';

import localRules from '../index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('no-raw-sql', localRules.rules['no-raw-sql'], {
  valid: [
    'prisma.user.findMany();',
    'prisma.$transaction([]);',
    'tx.user.count();',
    'prisma.user.update({ where: { id }, data: {} });',
  ],

  invalid: [
    {
      code: 'prisma.$queryRaw`SELECT 1`;',
      errors: [{ messageId: 'noRawSql' }],
    },
    {
      code: 'prisma.$executeRawUnsafe(\'DELETE FROM "User"\');',
      errors: [{ messageId: 'noRawSql' }],
    },
    {
      code: 'tx.$executeRaw`UPDATE "User" SET name = 1`;',
      errors: [{ messageId: 'noRawSql' }],
    },
    {
      code: "prisma.$queryRawUnsafe('SELECT 1');",
      errors: [{ messageId: 'noRawSql' }],
    },
  ],
});
