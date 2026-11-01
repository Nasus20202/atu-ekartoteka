# Proposal

## Why

Three session values decide access but lived only in the JWT: `mustChangePassword`, `role`, and the user id. The token is refreshed only on sign-in (or after a password change), and `session.maxAge` is unset, so a change in the database could take up to 30 days to matter. The profile endpoint even used the cached `mustChangePassword` to skip the current-password check, and a deleted account kept a working session.

## What Changes

- `mustChangePassword` is read from the user row when deciding whether `PATCH /api/user/profile` may skip the current-password check.
- Admin API routes and the `/admin` layout resolve the role from the database on each request and require an approved account; a demoted, rejected or deleted admin is refused immediately.
- The JWT callback signs the user out (returns `null`) when a session refresh finds that the account no longer exists.
- The user id moves to the standard `sub` claim; `session.user.id` is populated from it. `Session.user.role` is typed as `UserRole`.
- The "approved account" rule becomes one allowlist predicate (`isApprovedStatus` / `isApprovedAccount` / `isAdminRole` / `isApprovedAdmin`) used by pages, layouts and API routes.
- Password-reset and email-verification tokens are consumed atomically: a token that was already used by a concurrent request no longer changes the account.
- Users created by an admin through the single-user create endpoint must change the admin-chosen password on first login, matching the bulk-creation flow.
- The unused `Math.random()` verification-code generator is deleted.

### Non-goals

- No session revocation on password reset or on role change. A live token keeps working until it expires; closing that needs `session.maxAge` tuning or a token version, tracked separately.
- No change to how `status` gates tenant pages; it is already read from the database on every render.
- No rate limiting on authentication endpoints.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `authentication`: session claims come from the database where they decide access, deleted accounts are signed out on refresh, reset and verification tokens are single-use under concurrency.
- `user-management`: admin-created accounts must change the admin-chosen password; the current-password exemption for a forced change follows the database flag.

## Impact

`src/lib/auth/callbacks.ts`, `require-admin.ts`, `admin-access.ts`, `account-access.ts`, `src/app/api/user/profile/route.ts`, `src/app/api/reset-password/route.ts`, `src/app/api/verify-email/route.ts`, `src/lib/mutations/**`, `src/lib/queries/users/find-user-session-fields.ts`, `src/types/next-auth.d.ts`, the dashboard and admin layouts, and their tests. One extra primary-key read per admin API request and per admin page render; tenant pages already read the user row.
