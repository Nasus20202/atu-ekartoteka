# Tasks

## 1. Session claims

- [x] 1.1 Populate the JWT from `role` and `mustChangePassword` only and map the `sub` claim to `session.user.id` in `src/lib/auth/callbacks.ts`; verify `src/lib/auth/__tests__/callbacks.test.ts` covers the session mapping and the missing-subject case
- [x] 1.2 Return `null` from the `jwt` callback when the account no longer exists on the `update` trigger; verify the callback test asserts `null`
- [x] 1.3 Type `Session.user.role` as `UserRole` in `src/types/next-auth.d.ts`; verify `tsc --noEmit` reports no string/enum mismatch

## 2. Admin rights

- [x] 2.1 Add `src/lib/auth/admin-access.ts` with `isAdminRole`, `isApprovedAdmin` and `hasAdminAccess`, guarded by a test in `src/lib/auth/__tests__/admin-access.test.ts` for a demoted, unapproved and deleted admin
- [x] 2.2 Read the role and status from the database in `requireAdmin`, keeping the token role as a pre-filter; verify `src/lib/auth/__tests__/require-admin.test.ts` rejects a demoted admin and skips the query for a tenant
- [x] 2.3 Redirect a signed-in non-admin from the `/admin` layout to `/dashboard` and derive the dashboard navbar flag from the loaded user row; verify `tsc --noEmit` and the admin E2E suite in CI

## 3. Approved-account predicate

- [x] 3.1 Add `isApprovedStatus` and `isApprovedAccount` in `src/lib/auth/account-access.ts` and replace the page-level `status !== APPROVED` checks; verify `src/lib/auth/__tests__/account-access.test.ts` and the dashboard page tests

## 4. Token consumption

- [x] 4.1 Consume the reset token conditionally inside `resetPasswordTransaction` and reject the request when the row count is zero; verify the concurrent-consumption test in `src/app/api/reset-password/__tests__/route.test.ts`
- [x] 4.2 Consume the verification token conditionally inside `verifyEmailTransaction` and reject the request when the row count is zero; verify `src/lib/mutations/email-verification/__tests__/email-verification-mutations.test.ts` and the verify-email route test
- [x] 4.3 Delete the unused `generateVerificationCode` helper and its tests; verify `rg generateVerificationCode src` returns nothing

## 5. Admin-created passwords

- [x] 5.1 Set `mustChangePassword: true` in `create-admin-user` and update the create-route expectation; verify `src/lib/mutations/users/__tests__/create-users.test.ts` and the create route test

## 6. Integration

- [x] 6.1 Run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test`; verify all pass and no changed file exceeds 200 lines
- [x] 6.2 Confirm with `pnpm exec playwright test e2e/auth` in CI that the forced-change and access-control flows still behave

## Workflow follow-up

- Archive the change after review so the authentication and user-management specs pick up the deltas.
