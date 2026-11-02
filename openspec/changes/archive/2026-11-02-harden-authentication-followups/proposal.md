# Proposal

## Why

A review of the authentication framework found a set of small, independent gaps
around the pieces that were not covered by the session-hardening change:

- Email lookups are case-sensitive, registration does not normalise the address,
  and forgot-password lowercases it — so a mixed-case registration can create a
  duplicate account and can never reset its password.
- The first-admin bootstrap checks for an existing admin and creates the user in
  two separate statements, so two concurrent requests can both pass.
- Every API route has to remember to call `auth()`; a new route that forgets it
  is public with no test or lint failure.
- Login is measurably slower for unknown emails than for known ones.
- An authenticated non-admin receives `401` from admin APIs instead of `403`.
- The post-registration Turnstile bypass token can be replayed until it expires.
- Google sign-in links to an existing account without checking whether Google
  marked the address as verified.
- The forced-change allowlist matches on raw string prefixes, so a future
  `/login-*` route would silently bypass the guard.
- The payment-detail page skips the approved-account gate that the payment list
  uses.
- Environment variables still use the v4 names, and an unused adapter dependency
  is installed.

## What Changes

- Normalise email addresses (trim + lowercase) on write and match them
  case-insensitively on read; migrate existing rows.
- Create the first admin inside a serialisable transaction and map a duplicate
  email to the existing "already exists" response instead of a `500`.
- Add `requireUser` and a lint rule that every API route either uses an auth
  guard or is on the public-route allowlist.
- Run a constant-time dummy bcrypt comparison when the account does not exist.
- Return `403` from `requireAdmin` for an authenticated non-admin, and resolve the
  role from the database instead of the JWT.
- Drop the `role` claim from the session token: it is the only permission-shaped
  claim and its two consumers (the admin pre-filter and the `/` redirect) are
  convenience, not authority. `mustChangePassword` stays because the proxy reads
  it on every request as an optimistic redirect hint.
- Keep the registration auto-login grant stateless: an email-bound token with a
  short expiry, signed with HMAC.
- Reject a Google sign-in whose profile is explicitly unverified.
- Match the forced-change allowlist on path segments.
- Apply the approved-account gate to the payment-detail page.
- Rename the documented environment variables to `AUTH_SECRET` / `AUTH_URL`
  (with a legacy fallback) and remove `@auth/prisma-adapter`.
- Record in the authentication spec that account status and email verification
  are UI-level hints, not login gates.

### Non-goals

- No rate limiting or account lockout on authentication endpoints; Turnstile is
  the anti-automation control.
- No session revocation on password reset or role change (tracked with the
  session-version work).
- No bcrypt cost change: raising the cost from 10 to 12 would roughly quadruple
  the CPU spent per login.
- No change to the generated Prisma client layout.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `authentication`: case-insensitive email identity, stateless short-lived auto-login
  grants, unverified Google profile rejection, UI-level status/verification
  policy, `403` for authenticated non-admins, guarded API routes.

## Impact

`src/lib/auth/*`, `src/lib/queries/users/find-user-by-email.ts`,
`src/lib/mutations/users/*`, `src/app/api/register/route.ts`,
`src/app/api/user/profile/route.ts`, `src/app/api/resend-verification/route.ts`,
`src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`, one data-only
migration, `eslint.config.mjs`, a new lint rule, and the environment
examples. No existing API response shape changes except the admin status code.
