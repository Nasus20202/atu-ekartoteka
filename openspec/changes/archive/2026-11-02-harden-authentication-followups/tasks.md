# Tasks

## 1. Email identity

- [x] 1.1 Add `normalizeEmail` and use it in `findUserByEmail` (case-insensitive read) and every user-creation mutation; verify `src/lib/auth/__tests__/email.test.ts` and the updated provider/register tests
- [x] 1.2 Add the migration that lowercases non-colliding user emails; verify the SQL is idempotent and leaves colliding pairs untouched
- [x] 1.3 Use the helper in register, forgot-password and the Google callback; verify the register route normalises the stored address

## 2. Registration concurrency

- [x] 2.1 Add `createFirstAdmin` with a serialisable transaction and use it in `/api/register`; verify `create-first-admin.test.ts` covers the existing-admin and conflict cases
- [x] 2.2 Map `P2002`/`P2034` to the existing 400 messages in the register route; verify the route test asserts 400 instead of 500

## 3. API route guard

- [x] 3.1 Add `requireUser` with a test mirroring `require-admin.test.ts`; adopt it in `/api/user/profile` and `/api/resend-verification`
- [x] 3.2 Add `local/require-api-auth-guard` and its test, covering a guarded route and every allowlisted public route; verify `pnpm lint` passes
- [x] 3.3 Return `403` from `requireAdmin` for an authenticated non-admin and update the tests and spec
- [x] 3.4 Drop the `role` claim from the JWT and resolve the `/` redirect through a cached user read; verify the callback, provider and admin tests assert no role claim

## 4. Login hardening

- [x] 4.1 Compare against a lazily hashed dummy value when the account is missing or has no password; verify the provider test asserts the extra compare
- [x] 4.2 Verify the stateless auto-login token (email + short expiry) and assert the provider rejects a wrong password; verify the token tests cover expiry and email mismatch
- [x] 4.3 Reject a Google sign-in whose profile is explicitly unverified; verify `callbacks.test.ts`

## 5. Cleanup

- [x] 5.1 Match the forced-change allowlist on path segments and add a test for a prefix-adjacent path
- [x] 5.2 Apply the approved-account gate to the payment-detail page
- [x] 5.3 Rename the documented env vars to `AUTH_SECRET`/`AUTH_URL` with legacy fallbacks in compose and examples
- [x] 5.4 Remove `@auth/prisma-adapter` and refresh the lockfile

## 6. Integration

- [x] 6.1 Run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test`; verify all pass and no changed file exceeds 200 lines
- [x] 6.2 Confirm the auth E2E suite (`e2e/auth`) covers the changed login and access flows

## Workflow follow-up

- [x] Archive the change after review so the authentication spec picks up the deltas.
