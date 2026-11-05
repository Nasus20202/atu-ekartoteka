# Proposal

## Why

The five transactional emails use a generic 2010-style look (Arial, grey page, per-email button colours such as red for password reset) that does not match the application's shadcn/ui design. The templates have no tests beyond string substitution, so layout regressions are invisible. The E2E suite also disables SMTP, Cloudflare Turnstile and Google sign-in, so the flows that depend on them (verification and reset emails, bot protection, Google login) are never exercised end to end.

## What Changes

- Restyle all five email templates (HTML and plain text) to the site look: the shadcn colour tokens, 0.5rem radius, the system sans stack, a card on a muted page, one primary button style, a shared header and footer. Layout stays table based with inline styles so it works in email clients.
- Add Vitest tests for the templates: every placeholder is substituted, values are escaped, links point at `APP_URL`, HTML and text variants stay in sync, no placeholder is left over.
- Add Playwright visual screenshot tests that render each email at desktop and phone widths.
- Add in-repo local mocks for E2E: an SMTP capture server with a small HTTP inspection API, a Google OIDC identity provider, and a Cloudflare Turnstile widget script plus siteverify endpoint.
- Add a third app server ("integrations") with SMTP, Turnstile and Google enabled against the mocks, plus E2E specs for registration/verification, password reset, account approval emails, Google login and Turnstile pass/fail.
- Add optional environment overrides so the app can call the mocks: `TURNSTILE_VERIFY_URL` and `GOOGLE_ISSUER_URL` (with derived endpoints). They default to the real Cloudflare and Google endpoints.
- Run the mocks in `docker-compose.e2e.yaml` and in Playwright `webServer`.

**Non-goals**

- No change to email copy, subjects, variables or sending logic.
- No new email types, no dark-mode email styling, no inlining build step.
- The existing functional and visual servers keep SMTP, Turnstile and Google disabled.
- No change to the Turnstile widget script URL or the CSP: the browser-side script is intercepted in the test with Playwright routing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `email-notifications`: templates follow the site's visual style.
- `authentication`: Turnstile verification endpoint and Google issuer are configurable.
- `testing`: template unit tests, email visual tests, integration E2E specs; E2E external services are mocked rather than only disabled.
- `tooling`: Playwright runs the mock server and an integrations app server; compose gains matching services.

## Impact

- Code: `src/lib/email/templates/*`, `src/lib/turnstile.ts`, `src/lib/auth/providers.ts`, `.env.example`.
- Tests and tooling: `e2e/mocks/`, `e2e/integrations/`, `e2e/visual/emails.spec.ts`, `src/lib/email/__tests__/`, `playwright.config.ts`, `docker-compose.e2e.yaml`, CI e2e workflow.
- Dependencies (dev only): `smtp-server`, `mailparser` and their types.
