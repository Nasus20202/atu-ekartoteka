# Tasks

## 1. Delivered email assertions

- [x] 1.1 Add `e2e/utils/email-assertions.ts` and use it in the verification, admin notice, password reset, approval and Google admin notice specs; verify the integrations project passes and fails when a template sentence is changed
- [x] 1.2 Add `e2e/integrations/account-activation-email.spec.ts` (bulk create in the admin UI, assert the email, sign in with the temporary password); verify it passes

## 2. Visual login with Google

- [x] 2.1 Give the visual app dummy Google credentials in `playwright.config.ts` and `docker-compose.e2e.yaml`, assert the button in `public-pages.spec.ts` and regenerate the login baselines; verify the visual public pages pass and the snapshot shows the button
