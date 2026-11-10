# Proposal

## Why

Application logs and traces leave the process: they go to the cluster's log collection and, when `OTEL_EXPORTER_ENDPOINT` is set, to an external observability backend over OTLP. Today they carry personal data and secrets that no policy can justify keeping there:

- about 60 log calls write e-mail addresses of tenants, owners and administrators, including the address typed into a failed login for an account that does not exist (people often type a password or a typo there) and the e-mails of owners who have not registered (`bulk-users`);
- raw `{ error }` objects are logged, and Prisma or SMTP errors can carry argument values and recipient addresses;
- the Turnstile token and the whole Turnstile response are logged on failure;
- HTTP spans probably record the full URL, which for `/verify-email` and `/reset-password` includes a single-use token, and a client address.

GDPR data minimisation and storage limitation apply to these records. The privacy policy template (`add-privacy-policy`) must be able to say truthfully that logs hold an account identifier, not an e-mail address.

## What Changes

- Logs identify people only by the account ID. They never carry e-mail addresses, names, passwords, tokens, IP addresses or free-text user input. Events about identities that do not exist log no identifier.
- Errors are logged through one safe serializer (name, code, and a message with e-mail addresses removed and truncated), never as raw objects.
- The logger censors known personal fields as a backstop, and the OTLP log export inherits it.
- Spans carry no query string and no client address; token URLs never reach the backend.
- A new ESLint rule rejects logger calls whose context object has a personal-data key, so the problem cannot come back.
- The NextAuth debug logger no longer forwards its metadata.
- `AGENTS.md`, `docs/code-conventions.md` and the specs state the rule.

## Non-goals

- Log retention and the infrastructure that ships logs (set outside this repository).
- Metrics: their labels are only `result` and `type`, so they carry no personal data.
- Adding new log events or changing log levels beyond what the rule needs.
- Account deletion and data export.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `observability`: new requirements on what logs and traces may contain.
- `tooling`: a new lint rule requirement.

## Impact

- Code: `src/lib/logger.ts`, new `src/lib/logging/*`, `src/lib/opentelemetry/tracing.ts` and a new sanitizing span exporter, `src/instrumentation.ts`, `src/lib/auth/*`, `src/lib/turnstile.ts`, `src/lib/email/email-service.ts`, `src/lib/notifications/*`, `src/actions/**` and the admin API routes that log; `eslint-rules/*` and `eslint.config.mjs`.
- Tests: every touched call site gets a check that a canary e-mail never reaches the logger; the rule gets its own tests.
- Docs: `AGENTS.md`, `docs/code-conventions.md`.
- Dependencies, environment variables and infrastructure: none.
