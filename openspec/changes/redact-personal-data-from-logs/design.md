# Design

## Context

See proposal.md for motivation. Current state:

- `src/lib/logger.ts` builds one `pino` instance (`LOG_LEVEL`, default `info`) and `createLogger(context)` returns a child. There are no `redact` or `serializers` options. `PinoInstrumentation` forwards every record to the OTLP log exporter when `OTEL_EXPORTER_ENDPOINT` is set, and the cluster also collects the same lines from stdout.
- About 60 call sites pass `email`, `to`, `adminEmail`, `newUserEmail` or `userEmail` in the context object (inventory below). Several pass a raw `{ error }`. `turnstile.ts` logs `{ token }` and the whole response.
- `src/lib/auth/config.ts` forwards NextAuth `warn` and `debug` output, including `metadata`, to the logger.
- `src/instrumentation.ts` logs `request.path` and `error.message` for failed requests.
- `tracing.ts` builds `HttpInstrumentation` with a `requestHook` that only renames the span; its attributes are whatever the instrumentation sets, which probably includes the URL and a client address. Span names already drop the query string (`normalizeSpanPath`).
- Metrics only use `result` and `type` labels.
- `eslint-rules/` holds local rules registered in `index.mjs`, each with a test under `eslint-rules/__tests__`.

## Goals / Non-Goals

**Goals:**

- No direct identifier in any log or span that leaves the process.
- Keep the logs useful: who (account ID), what (event, result), when.
- Make the rule enforceable by tooling, not by memory.

**Non-Goals:**

- Retention and shipping of logs (outside the repository), metrics, new log events.

## Decisions

### 1. Identify by account ID; log nothing for unknown identities

Replace `email`, `adminEmail`, `newUserEmail`, `userEmail` and `to` with `userId`, `adminId`, `targetUserId` where the person exists in the database, and drop the field where it does not (unknown login, password reset for an unknown address). Audit lines about administrators keep `adminId`; an unauthenticated attempt logs no actor. E-mail sends log `{ type, result }` (the message ID if the transport returns one). Token logging keeps `tokenLength` and `tokenFingerprint` (first 12 hex characters of a SHA-256 of a single-use token), which identify nothing.

Rejected: hashing e-mail addresses. An unsalted hash of an address is still personal data and is reversible for known addresses; a salted one cannot be correlated across restarts without storing the salt, and the account ID already serves that purpose.

### 2. One safe error serializer

`src/lib/logging/serialize-error.ts` exports `serializeError(error)` returning `{ name, code?, message }`: `code` is read when present (Prisma `code`, Node `code`), and `message` goes through `redactEmails` (`src/lib/logging/redact.ts`, replacing anything matching an e-mail pattern with `[redacted-email]`) and is truncated to 300 characters. For Prisma errors the message is replaced by the error name and code, because the message echoes the failed call and its arguments. `logger.ts` registers it as the pino serializer for the `error` and `err` keys, so every existing `{ error }` call site is covered without being edited one by one; sites that build their own `error: message` strings are changed to pass the error.

### 3. Pino `redact` as a backstop

`logger.ts` adds `redact: { paths, censor: '[redacted]' }` with the fields `email`, `to`, `name`, `password`, `token` at the top level and under `*` (one level). The `name` of a scheduled task would be censored too, so the scheduler logs it as `task`. This catches a mistake that slips past review and the lint rule, and `PinoInstrumentation` exports the censored record.

### 4. Lint rule `local/no-personal-data-in-logs`

`eslint-rules/no-personal-data-in-logs.mjs` reports a `CallExpression` whose callee is `<identifier>.<level>` (levels `trace`, `debug`, `info`, `warn`, `error`, `fatal`; the identifier is `logger` or `log`) when its first argument is an object literal with a forbidden key, including shorthand properties. Forbidden: `email`, `to`, `password`, `token`, `ip`, `phone`, `username`, `fullName`, `firstName`, `lastName`, `ownerName`, and any key ending in `Email`, `Password`, `Token` or `Ip`. Allowed by exact match: `tokenLength`, `tokenFingerprint`, `hasName`. It is registered in `index.mjs`, enabled for application code and off for tests. Test files in `__tests__` and `e2e` are not linted by it.

### 5. Call-site inventory

- Auth: `lib/auth/providers.ts`, `callbacks.ts`, `require-admin.ts`, `require-action.ts`, `admin-access.ts`, `config.ts` (NextAuth `warn` and `debug`), `lib/turnstile.ts`.
- Account actions: `actions/auth/register.ts`, `registration-notifications.ts`, `verify-email.ts`, `forgot-password.ts`, `reset-password.ts`, `actions/account/profile.ts`, `verification.ts`.
- Admin actions and routes: `actions/users/users.ts`, `bulk-users.ts`, `actions/apartments/apartments.ts`, `app/api/admin/import/route.ts`, `import/validate/route.ts`.
- E-mail and notifications: `lib/email/email-service.ts`, `lib/notifications/new-user-registration.ts`, `account-status.ts`.
- Infrastructure: `instrumentation.ts` (`request.path` without the query, errors through the serializer), `lib/cron/scheduler.ts` (`task` instead of `name`).

### 6. Sanitizing span exporter

`HttpInstrumentation` sets its URL and address attributes at different moments, so changing them in `requestHook` is fragile. `src/lib/opentelemetry/sanitizing-span-exporter.ts` wraps the OTLP trace exporter and, before each export, removes the query string from every URL-shaped attribute (`http.url`, `url.full`, `http.target`) and deletes `url.query`, `http.client_ip`, `client.address`, `net.peer.ip`, `net.sock.peer.addr` and `http.request.header.*` attributes. The first task of the group captures the real attribute set of a request in an in-memory exporter, so the key list is taken from the instrumentation version in use, not guessed. The span name logic is unchanged.

### 7. NextAuth debug output

`config.ts` forwards only `message` from `debug` and `warn`; `metadata` is dropped.

### 8. Tests

Each touched call site's test gets a canary check: the function runs with an address such as `canary@example.com`, and the serialized arguments of every mocked logger call must not contain it. A shared helper `expectNoPersonalData(calls, canaries)` keeps the checks short. The serializer, the redaction, the exporter and the lint rule have their own tests, and one end-to-end check greps the server log of an e2e run for the seeded addresses.

## Risks / Trade-offs

- [Logs become harder to correlate with a person during an incident] → The account ID joins to the database, which is where the person is known. Failed attempts for unknown accounts are still counted by the auth metrics.
- [The serializer hides a useful database error message] → The code and name remain, and the trace ID links the log to its span.
- [Key list in the exporter misses an attribute of a newer instrumentation version] → A test snapshots the attribute set of a request, so an upgrade that adds one fails the test.
- [Lint rule misses a variable passed as the whole context object] → The pino `redact` backstop and the canary tests cover it; the rule targets the common literal form.

## Migration Plan

No data or configuration changes. Deploy normally. Logs already written are unaffected and age out under the log retention set outside this repository.
