import { RuleTester } from 'eslint';

import localRules from '../index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run(
  'no-personal-data-in-logs',
  localRules.rules['no-personal-data-in-logs'],
  {
    valid: [
      "logger.info({ userId }, 'x');",
      "logger.warn({ adminId: session.user.id, userId }, 'x');",
      "logger.info({ tokenLength: 5, tokenFingerprint: 'a', hasName: true }, 'x');",
      "logger.info({ mustChangePassword: true }, 'x');",
      "logger.info({ task: name }, 'x');",
      "logger.info('plain message');",
      "logger.error({ error }, 'x');",
      "mailer.send({ email: 'a@b.pl' });",
      "logger.info(context, 'x');",
    ],

    invalid: [
      {
        code: "logger.info({ email }, 'x');",
        errors: [{ messageId: 'personalKey', data: { name: 'email' } }],
      },
      {
        code: "logger.warn({ adminEmail: a }, 'x');",
        errors: [{ messageId: 'personalKey', data: { name: 'adminEmail' } }],
      },
      {
        code: "logger.error({ to }, 'x');",
        errors: [{ messageId: 'personalKey' }],
      },
      {
        code: "log.debug({ token, userId }, 'x');",
        errors: [{ messageId: 'personalKey', data: { name: 'token' } }],
      },
      {
        code: "logger.info({ password: p, newUserEmail: e }, 'x');",
        errors: [{ messageId: 'personalKey' }, { messageId: 'personalKey' }],
      },
      {
        code: "logger.info({ 'clientIp': ip }, 'x');",
        errors: [{ messageId: 'personalKey', data: { name: 'clientIp' } }],
      },
    ],
  }
);
