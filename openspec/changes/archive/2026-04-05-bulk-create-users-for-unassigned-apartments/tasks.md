# Tasks: Bulk Create Users for Unassigned Apartments

## [x] Task 1 — Database: add `mustChangePassword` field

- Add `mustChangePassword Boolean @default(false)` to the `User` model in `prisma/schema.prisma`.
- Generate and apply a Prisma migration.
- Regenerate the Prisma client.
- Update the `User` type in `src/lib/types/user.ts` to include `mustChangePassword: boolean`.

## [x] Task 2 — Session: include `mustChangePassword` in JWT

- In the NextAuth `jwt` callback (`src/auth.ts` or equivalent), fetch `mustChangePassword` from the DB on session refresh and include it in the token.
- In the `session` callback, expose `session.user.mustChangePassword`.
- Update the `Session` / `JWT` type augmentation so TypeScript is aware of the field.
- Update `src/__tests__/auth.test.ts` and any session-related tests to assert the new field is present.

## [x] Task 3 — API: `GET /api/admin/unassigned-apartments`

- Create `src/app/api/admin/unassigned-apartments/route.ts`.
- Query apartments where `userId IS NULL` and `email IS NOT NULL`, include HOA name, sort by HOA name then building then number.
- Return the response grouped by HOA as specified in the design.
- Guard with admin-only auth check (401 for non-admins).
- Write unit tests in `src/app/api/admin/unassigned-apartments/__tests__/route.test.ts` covering: success, empty result, 401 for non-admin.

## [x] Task 4 — Email: activation email template and service method

- Create `src/lib/email/templates/account-activation.html` and `account-activation.txt`.
- Add `'account_activation'` to the `EmailType` union in `src/lib/email/email-service.ts`.
- Add `sendAccountActivationEmail(to: string, tempPassword: string, name?: string): Promise<boolean>` to `EmailService`.
- Write unit tests in `src/lib/email/__tests__/email-service.test.ts` (or a new `account-activation.test.ts`) covering the new method.

## [x] Task 5 — API: `POST /api/admin/users/bulk-create`

- Create `src/app/api/admin/users/bulk-create/route.ts`.
- Implement the processing logic from the design: fetch apartments, deduplicate by email, create users with `mustChangePassword: true`, assign apartments, send activation emails.
- Use `crypto.randomBytes` for temporary password generation.
- Wrap DB operations in a Prisma transaction.
- Return `{ created, skipped, errors }` summary.
- Guard with admin-only auth check.
- Write unit tests in `src/app/api/admin/users/bulk-create/__tests__/route.test.ts` covering: success (single and multi-apartment), email deduplication, already-existing email skipped, 401, empty `apartmentIds` rejected.

## [x] Task 6 — Middleware: forced password change redirect

- Extend `src/middleware.ts` (or Next.js middleware config) to check `session.user.mustChangePassword`.
- Redirect to `/change-password` for all routes except the allowlist: `/change-password`, `/api/user/profile`, `/api/auth/*`, and static assets.
- Write unit/integration tests for the middleware logic covering: `mustChangePassword: false` (no redirect), `mustChangePassword: true` (redirect), allowlisted routes not redirected.

## [x] Task 7 — API: update `PATCH /api/user/profile` to clear `mustChangePassword`

- When a password change is successfully saved, set `mustChangePassword: false` on the user record in the same DB call.
- Update the existing unit tests to assert `mustChangePassword` is cleared after a password change.

## [x] Task 8 — Frontend: `/change-password` page

- Create `src/app/change-password/page.tsx`.
- Form with "Nowe hasło" and "Potwierdź nowe hasło" fields (shadcn/ui).
- On submit, call `PATCH /api/user/profile` with `newPassword`.
- On success, call `update()` (NextAuth session update) then redirect to `/dashboard`.
- No skip/cancel option.
- Write a React Testing Library test in `src/app/change-password/__tests__/page.test.tsx` covering: renders form, submit calls API, redirects on success, shows error on failure.

## [x] Task 9 — Frontend: `/admin/users/bulk-create` page

- Create `src/app/admin/users/bulk-create/page.tsx`.
- Fetch `GET /api/admin/unassigned-apartments` on mount (use SWR or React Query consistent with the codebase).
- Render HOA-grouped list with per-HOA "select all" checkbox and per-row checkbox.
- "Utwórz konta" button (disabled when nothing selected).
- On confirm, POST to `/api/admin/users/bulk-create`, show toast with result summary, refresh list.
- Empty state when no unassigned apartments remain.
- Write React Testing Library tests in `src/app/admin/users/bulk-create/__tests__/page.test.tsx` covering: renders list grouped by HOA, select-all HOA checkbox, individual selection, confirm triggers API call, empty state.

## [x] Task 10 — Frontend: link bulk-create from admin users page

- Add a "Utwórz konta masowo" button/link to `src/app/admin/users/page.tsx` (or the relevant admin users list component) pointing to `/admin/users/bulk-create`.

## [x] Task 11 — Update OpenSpec specs

- Update `openspec/specs/user-management/spec.md`: add bulk creation scenarios and `mustChangePassword` forced change scenario.
- Update `openspec/specs/authentication/spec.md`: add forced password change on first login scenario.
- Update `openspec/specs/apartment-management/spec.md`: add unassigned apartments listing scenario.

## [x] Task 12 — E2E tests

- Add `e2e/admin/admin-bulk-create-users.spec.ts` covering:
  - Admin sees unassigned apartments grouped by HOA.
  - Admin selects one apartment and creates account; activation email is not checked in E2E (SMTP disabled) but the user appears as APPROVED in the user list.
  - Admin selects all in a HOA.
  - Newly created user is forced to change password on first login.
  - After password change, user can access dashboard.
