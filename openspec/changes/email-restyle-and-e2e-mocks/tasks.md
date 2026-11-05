# Tasks

## 1. Email restyle and template tests

- [x] 1.1 Restyle the five `.html` templates to the shared layout (header, card, primary button, fallback URL, footer); verify by rendering each in a browser and checking no horizontal scroll at 375px
- [x] 1.2 Align the five `.txt` templates (same links, sign-off); verify with the text/HTML parity test
- [x] 1.3 Add `src/lib/email/__tests__/email-templates.test.ts` (placeholders, escaping, APP_URL links, HTML/text parity, subjects); verify with `pnpm vitest --run src/lib/email`
- [x] 1.4 Add `e2e/visual/emails.spec.ts` with desktop and phone screenshots for all five emails, generate baselines with `pnpm test:e2e:visual:update`; verify the visual projects pass on a second run
- [x] 1.5 Update `openspec/specs/email-notifications` via the change deltas; verify `openspec validate`

## 2. Provider overrides

- [x] 2.1 Read `TURNSTILE_VERIFY_URL` in `verifyTurnstileToken` with the Cloudflare default; verify with unit tests for default URL, override URL and fail-closed behaviour
- [x] 2.2 Configure the Google provider with `GOOGLE_ISSUER_URL` when set; verify with a provider unit test that the default config is unchanged and the override is applied
- [x] 2.3 Document both variables in `.env.example` and the config context; verify `pnpm lint` and `pnpm format:check`

## 3. Mock server

- [ ] 3.1 Add dev dependencies `smtp-server`, `mailparser` and their types; verify `pnpm install` and typecheck
- [ ] 3.2 Implement SMTP capture plus `/mail` API in `e2e/mocks/`; verify with a unit test that sends a message with nodemailer and reads it back
- [ ] 3.3 Implement the Google OIDC mock (discovery, authorize, token, jwks, userinfo); verify with a unit test that the issued `id_token` validates against the jwks
- [ ] 3.4 Implement Turnstile siteverify and `/health`; verify with unit tests for valid and invalid tokens
- [ ] 3.5 Add the typed client `e2e/utils/mock-server.ts`; verify it is used by the specs in group 5

## 4. Playwright and Docker wiring

- [ ] 4.1 Add the mock server and the integrations app (port 3002) to `playwright.config.ts`, plus the `chromium-integrations` project and ignore rules in the other projects; verify `pnpm test:e2e --list` shows the new project
- [ ] 4.2 Add `mocks` and `ekartoteka-integrations` services to `docker-compose.e2e.yaml` and update the CI e2e workflow to run the new project; verify `docker compose config` and a CI-like run
- [ ] 4.3 Update `openspec/specs/tooling` and `testing` through the change deltas; verify `openspec validate`

## 5. Integration E2E specs

- [ ] 5.1 Registration sends a verification email; the spec reads it from the mock and opens the link; verify the account is verified
- [ ] 5.2 Password reset email flow; verify the new password logs in
- [ ] 5.3 Admin approval sends the approved email; verify subject and login link
- [ ] 5.4 Google login for a new and a returning user; verify the pending-account and dashboard outcomes and the admin notification email
- [ ] 5.5 Turnstile: valid token logs in, invalid token is rejected; verify both on login and registration
- [ ] 5.6 Run the whole suite (`pnpm test:e2e`) and `pnpm test`; verify existing functional and visual projects are unaffected

## Workflow follow-up

- Ask for approval before the final commit, then verify and archive the change.
