# Design

## Context

Templates live in `src/lib/email/templates/*.{html,txt}` and are rendered by `renderEmailTemplate` (`{{VAR}}` substitution, HTML escaping). `email-messages.ts` builds `{subject, html, text}` per email. `EmailService` sends through nodemailer when `SMTP_HOST` is set. Turnstile verification is `verifyTurnstileToken` in `src/lib/turnstile.ts` (hard-coded Cloudflare URL); Google is the Auth.js provider in `src/lib/auth/providers.ts`. Playwright runs two `next start` servers (3000 functional, 3001 visual); the visual project already has a screenshot pipeline (`e2e/visual`, `screenshot.css`).

## Goals / Non-Goals

**Goals:** emails that look like the site; regression safety for templates; real end-to-end coverage of SMTP, Turnstile and Google without internet access.

**Non-Goals:** testing in real email clients, dark-mode emails, changing the production CSP.

## Decisions

**1. Template layout.** Keep the `{{VAR}}` approach and five files, but introduce a shared look by convention: every HTML file has the same header band (app name), white card (`border-radius: 8px`, 1px border `#e2e8f0`), footer, and a button in primary `#2563eb` (hsl 221.2 83.2% 53.3%) with `#f8fafc` text; text `#0f172a`, muted `#64748b`, page `#f1f5f9`. Font stack `-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` (Geist is not loadable in mail clients). Width `max-width: 600px` with `width: 100%` so phones fit. _Alternative:_ a layout partial in the loader (`{{> layout}}`) removes duplication but changes the loader and the "all five template pairs" spec; rejected to keep the change visual. Fallback link line shows the raw URL (`{{VERIFICATION_URL}}` etc.). Text templates keep their structure and gain the same sign-off.

**2. Unit tests** in `src/lib/email/__tests__/email-templates.test.ts`, parametrised over the five message builders with fixed inputs: no `{{` left, links start with `APP_URL`, `<script>` in a name is escaped in HTML and not in text, every URL in HTML appears in text, subjects unchanged.

**3. Email visual tests** `e2e/visual/emails.spec.ts` render the builder output directly (Playwright resolves the `@/` alias from tsconfig) with `page.setContent`; no app or SMTP needed. Snapshots follow the existing `snapshotPathTemplate` for desktop and mobile projects. _Alternative:_ screenshot messages captured from the mock; rejected because it makes snapshots depend on flows and token values.

**4. One mock server** `e2e/mocks/server.ts` (Node, no framework), started with `node --experimental-strip-types` or `tsx` if already available:

- SMTP on `MOCK_SMTP_PORT` (1025) using `smtp-server` (no TLS, auth optional) and `mailparser`.
- HTTP on `MOCK_HTTP_PORT` (4010):
  - `GET /mail?to=<email>` → `[{ to, subject, html, text, date }]`, newest first; `DELETE /mail?to=` clears.
  - OIDC: `/google/.well-known/openid-configuration`, `/google/authorize` (auto-approves, 302 back with `code` and `state`; the identity comes from a `login_hint` or the last `POST /google/identity` `{email,name,sub}`), `/google/token` (returns `id_token` signed RS256 with an in-memory key plus access token), `/google/jwks`, `/google/userinfo`.
  - `POST /turnstile/siteverify` (form `secret`, `response`) → `{success: true}` if the token is `mock-valid-token`, else `{success:false,'error-codes':['invalid-input-response']}`.
  - `GET /health`.

State is in memory, keyed by recipient or `sub`, so parallel workers do not collide as long as each test uses a unique email (existing helpers already do).

**5. App overrides.** `TURNSTILE_VERIFY_URL` (default `https://challenges.cloudflare.com/turnstile/v0/siteverify`) read in `verifyTurnstileToken`. `GOOGLE_ISSUER_URL`: when set, `Google({ issuer })` is configured so Auth.js discovers endpoints from the mock; unset keeps the current provider untouched. Both are documented in `.env.example` and `openspec/config.yaml` context. Neither affects production defaults. The Turnstile browser widget is not overridden: in integration specs Playwright `page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', ...)` fulfils a stub that defines `window.turnstile.render` and calls the callback with `mock-valid-token` (or an invalid token for the failure spec). This keeps CSP and `TurnstileField` unchanged.

**6. Integrations app server** on port 3002 using the same build and the functional database `e2e`: `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, `EMAIL_FROM`, `APP_URL=http://localhost:3002`, `TURNSTILE_SITE_KEY`/`SECRET_KEY` set to dummy values, `TURNSTILE_VERIFY_URL`, `GOOGLE_CLIENT_ID/SECRET` dummy, `GOOGLE_ISSUER_URL=http://localhost:4010/google`. A Playwright project `chromium-integrations` matches `e2e/integrations/**` and uses that base URL; the other projects ignore that folder. Isolating these flows keeps the existing suites free of the mock dependency and Turnstile. Docker Compose adds `mocks` (node image running the same script, `node:22-alpine`, mounting `e2e/mocks`) and `ekartoteka-integrations` (image reused, `pull_policy: never`, env pointing at `mocks`). Because nodemailer runs with `rejectUnauthorized` in production, plain SMTP without TLS is used, which the mock supports.

**7. Specs.** `e2e/integrations/`: `email-verification.spec.ts`, `password-reset-email.spec.ts`, `account-approved-email.spec.ts`, `google-login.spec.ts`, `turnstile.spec.ts`, helpers in `e2e/utils/mock-server.ts` (typed client for the mock API). Each file stays under 200 lines.

## Risks / Trade-offs

- [Email client rendering differs from Chromium screenshots] → keep to table layout and inline styles; screenshots catch regressions only.
- [Mock OIDC drifts from Google's real behaviour] → it implements only the discovery/authorize/token/jwks subset Auth.js needs; the real provider path is unchanged when the env var is unset.
- [Auth.js `issuer` override may not also move the `authorization` endpoint] → verify during implementation; fall back to explicit `authorization`, `token`, `userinfo` URLs under the same env var.
- [New dev dependencies] → `smtp-server` and `mailparser` are small, maintained by the nodemailer author, dev-only.
- [Snapshots are platform dependent] → same Docker-based update flow as existing visual tests.
