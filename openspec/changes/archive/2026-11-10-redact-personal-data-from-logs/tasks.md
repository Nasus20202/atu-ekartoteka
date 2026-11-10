# Tasks

## 1. Logging primitives

- [x] 1.1 Add `src/lib/logging/redact.ts` (`redactEmails`) and `serialize-error.ts` (`serializeError`: name, code, redacted and truncated message, Prisma errors reduced to name and code) with tests covering a Prisma error with argument values, an SMTP error with an address, a non-error value and truncation; verify with `pnpm vitest run src/lib/logging`.
- [x] 1.2 Update `src/lib/logger.ts` with the `error` and `err` serializers and the `redact` paths from design D3, and extend its tests to show a passed `email` is written as `[redacted]`, an `{ error }` is serialized, and the OTLP-bound record carries the same; verify with `pnpm vitest run src/lib/__tests__`.
- [x] 1.3 Add the test helper `expectNoPersonalData(calls, canaries)` in `src/lib/logging/testing.ts`; verify with its own test.

## 2. Authentication and bot check

- [x] 2.1 Change `lib/auth/providers.ts` to log `userId` and no e-mail on success, wrong password and missing-password paths, and nothing identifying for an unknown account or a missing Turnstile token; update its tests with canary checks; verify with `pnpm vitest run src/lib/auth`.
- [x] 2.2 Change `callbacks.ts`, `admin-access.ts`, `require-admin.ts` and `require-action.ts` to log `userId` or no actor (no `'anonymous'` e-mail); update their tests; verify with `pnpm vitest run src/lib/auth`.
- [x] 2.3 Change `lib/turnstile.ts` to log error codes only and never the token or the response, and `lib/auth/config.ts` to forward only the `message` of NextAuth `warn` and `debug`; update their tests; verify with `pnpm vitest run src/lib`.

## 3. Account actions

- [x] 3.1 Change `actions/auth/register.ts`, `registration-notifications.ts`, `verify-email.ts`, `forgot-password.ts` and `reset-password.ts` to log `userId` only, and nothing for unknown or OAuth accounts; update their tests with canary checks; verify with `pnpm vitest run src/actions/auth`.
- [x] 3.2 Change `actions/account/profile.ts` and `verification.ts` the same way (log which fields changed, never their values); update their tests; verify with `pnpm vitest run src/actions/account`.

## 4. Admin actions, notifications and e-mail

- [x] 4.1 Change `actions/users/users.ts` and `actions/apartments/apartments.ts` to log `adminId` and the entity ID; update tests; verify with `pnpm vitest run src/actions/users src/actions/apartments`.
- [x] 4.2 Change `actions/users/bulk-users.ts` to log counts and internal apartment IDs only; update tests so no owner e-mail or owner ID is logged; verify with `pnpm vitest run src/actions/users`.
- [x] 4.3 Change the admin import and validate routes to log `adminId`; update tests; verify with `pnpm vitest run src/app/api/admin`.
- [x] 4.4 Change `lib/email/email-service.ts`, `lib/notifications/new-user-registration.ts` and `account-status.ts` to log the e-mail type and result, no addresses; update tests; verify with `pnpm vitest run src/lib/email src/lib/notifications`.
- [x] 4.5 Change `lib/cron/scheduler.ts` to log `task` instead of `name`, and replace every remaining hand-built `error: message` field with the error itself; update tests; verify with `pnpm vitest run src/lib/cron`.

## 5. Request errors and traces

- [x] 5.1 Change `instrumentation.ts` to log the request path without its query string and the error through the serializer; update its test; verify with `pnpm vitest run src/__tests__`.
- [x] 5.2 Capture the real attribute set of a request span (a request with a query string and an `X-Forwarded-For` header) with an in-memory exporter, then add `lib/opentelemetry/sanitizing-span-exporter.ts` that strips query strings from URL attributes and deletes the query and client address attributes (design D6), wire it around the OTLP trace exporter in `tracing.ts`, and add tests for the token URL, the client address, the unchanged span name and a snapshot of the attribute keys; verify with `pnpm vitest run src/lib/opentelemetry`.

## 6. Lint rule

- [x] 6.1 Add `eslint-rules/no-personal-data-in-logs.mjs` (design D4) with `__tests__/no-personal-data-in-logs.test.mjs` for flagged keys, shorthand properties, allowed keys and non-logger calls, register it in `eslint-rules/index.mjs`, enable it for application code in `eslint.config.mjs` and off for tests; verify with `node --test eslint-rules/__tests__` (or the project's rule test command) and `pnpm lint`, which must pass with no remaining violations.

## 7. Documentation and specs

- [x] 7.1 Update the `Inputs and errors` bullet in `AGENTS.md` (log account IDs, never e-mails, names, tokens or IPs; errors through the serializer) and add a logging section to `docs/code-conventions.md`; verify the wording against the code.
- [x] 7.2 Verify the specs with `openspec validate redact-personal-data-from-logs --strict`.

## 8. Integration

- [x] 8.1 Run the e2e suite with the server log captured and assert the log contains none of the seeded e-mail addresses; run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm vitest run`; verify all pass and fix what they report.

## Workflow follow-up

- Apply this change before `add-privacy-policy`, because the policy template describes its result.
- Archive it with `openspec-archive-change` before the pull request is merged: the CI lint job fails while an unarchived change exists.
