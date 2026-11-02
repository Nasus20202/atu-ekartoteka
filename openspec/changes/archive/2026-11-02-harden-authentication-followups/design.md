# Design

## Context

See proposal.md — Why. Sessions stay stateless JWTs; the access rules already
live in `src/lib/auth/account-access.ts` and `admin-access.ts`. User-creation
mutations are thin Prisma wrappers, and API routes call `auth()` directly. Cron
jobs already delete expired verification and reset rows.

## Goals / Non-Goals

**Goals:**

- One email identity per person regardless of how the address was typed.
- Fail-closed defaults: an unguarded API route is a lint error, a replayed
  grant is refused.
- Keep the login path's work uniform and bounded.

**Non-Goals:**

- DB-level `citext` or a functional unique index; the user table is small, so a
  case-insensitive read plus normalised writes is enough.
- Storing IP addresses for throttling.

## Decisions

**Normalise at the edge, match case-insensitively on read.**
`normalizeEmail` (trim + lowercase) runs when a user is created and when an
address is looked up. `findUserByEmail` uses `findFirst` with
`mode: 'insensitive'` so legacy mixed-case rows keep working before and after
the migration; the migration lowercases rows that would not collide, and leaves
a colliding pair untouched rather than deleting an account.

**First-admin creation is one serialisable transaction.**
`createFirstAdmin` checks for an existing admin and inserts the user inside
`prisma.$transaction(..., { isolationLevel: 'Serializable' })`. A concurrent
loser either sees the admin after the conflict or gets `P2034`, which the route
maps to the existing "administrator already exists" message. A duplicate email
(`P2002`) maps to the "email already exists" message instead of a `500`.

**The auto-login grant stays stateless.**
The token payload carries the normalised email and a 15-second expiry, signed
with HMAC. The provider verifies it after the password check, so a typo does not
burn it. Making the grant single-use would require a database table, a
migration, and a cleanup path to defend against replaying a token that is bound
to the account whose password the caller already knows and only skips a
Turnstile challenge — not worth the complexity.

**Login always performs one bcrypt comparison.**
When the account is missing, or has no password (Google-only), the provider
compares the submitted password against a lazily hashed dummy value at the same
cost. The dummy hash is computed once per process.

**The session carries `sub` and `mustChangePassword` only.**
The role claim is removed. Its two consumers were a tenant pre-filter in
`requireAdmin` and the `/` redirect; both can read the database, and neither is
an authority decision. Removing it eliminates the only claim that could go stale
for the token lifetime while looking like a permission. `mustChangePassword`
stays because the proxy consults it on every request to redirect before any
layout runs — the documented "optimistic check from the cookie" pattern — and
the authoritative check stays next to the data in the profile route. The claim
is refreshed by `update({})` immediately after the password change.

**API-route guard is enforced by lint, not by middleware.**
`requireUser` mirrors `requireAdmin` and returns either the session or a `401`
response. A local ESLint rule (`local/require-api-auth-guard`) fails a
`src/app/api/**/route.ts` module that imports none of `@/lib/auth/require-user`,
`@/lib/auth/require-admin` or `@/auth`, unless the path is on an explicit public
allowlist. This keeps the existing public endpoints (auth, config, register,
password flows, health) documented in one place.

**Email verification and account status stay UI-level.**
The product decision is that a `PENDING`/`REJECTED`/unverified user may sign in
to see the status card and profile, but tenant data pages hide the data through
`isApprovedAccount`. The spec is amended to say so instead of implying login is
blocked.

## Risks / Trade-offs

- **`mode: 'insensitive'` cannot use the email index** → accepted; the user
  table is small and the read is not on a hot path.
- **A serialisable first-admin transaction can surface `P2034`** → mapped to a
  user-facing message; a retry is not needed because losing the race means an
  admin already exists.
- **A lint allowlist can drift** → the rule names the exact public routes, and
  an unlisted public route fails loudly instead of being silently open.

## Migration Plan

One data-only migration that lowercases non-colliding user emails. No column or
table changes. Deploy order is irrelevant because reads are case-insensitive
either way.
