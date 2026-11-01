import { RuleTester } from 'eslint';

import localRules from '../index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run(
  'prefer-access-helpers',
  localRules.rules['prefer-access-helpers'],
  {
    valid: [
      'if (isApprovedAccount(user)) { render(); }',
      'if (isAdminRole(session.user.role)) { render(); }',
      'if (response.status === 200) { render(); }',
      'if (user.status === AccountStatus.PENDING) { render(); }',
      'if (user.role === UserRole.TENANT) { render(); }',
      "if (payload.status === 'APPROVED') { render(); }",
      'switch (user.status) { case AccountStatus.APPROVED: break; }',
    ],

    invalid: [
      {
        code: 'if (session.user.role === UserRole.ADMIN) { render(); }',
        errors: [{ messageId: 'preferAccessHelper' }],
      },
      {
        code: 'if (UserRole.ADMIN !== user.role) { render(); }',
        errors: [{ messageId: 'preferAccessHelper' }],
      },
      {
        code: 'const blocked = user.status !== AccountStatus.APPROVED;',
        errors: [{ messageId: 'preferAccessHelper' }],
      },
      {
        code: 'const blocked = status === AccountStatus.APPROVED;',
        errors: [{ messageId: 'preferAccessHelper' }],
      },
      {
        code: 'const admin = session?.user?.role === UserRole.ADMIN;',
        errors: [{ messageId: 'preferAccessHelper' }],
      },
      {
        code: "const approved = user.status === 'APPROVED';",
        errors: [{ messageId: 'preferAccessHelper' }],
      },
      {
        code: 'if (account.role != UserRole.ADMIN) { render(); }',
        errors: [{ messageId: 'preferAccessHelper' }],
      },
    ],
  }
);

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
