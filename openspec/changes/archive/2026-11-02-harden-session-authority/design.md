# Design

## Context

See proposal.md — Why. The session is a NextAuth JWT (`session.strategy = 'jwt'`), refreshed on sign-in and on the `update` trigger; `session.maxAge` is unset, so the default 30 days applies. The proxy already gates `/change-password` on the token, and tenant pages read the user row through React-cached queries.

## Goals / Non-Goals

**Goals:**

- Cache only what steers the UI; read the database wherever a claim decides access.
- Keep the extra reads proportional: no per-request lookups on tenant pages that already load the row.

**Non-Goals:**

- Revoking a live session mid-flight (tracked in `harden-authentication-surface`).
- Enforcing email verification or gaining a session-revocation channel.

## Decisions

**The token keeps `role` and `mustChangePassword`; `id` moves to `sub`.**
Auth.js already sets `sub` from the provider user, so a second `id` claim was a duplicate that could drift. The session callback maps `sub` to `session.user.id`. `role` and `mustChangePassword` stay because the proxy and the navigation render on every request and must not query per navigation.

**Admin checks read the database; tenant checks use the row they already have.**
`requireAdmin` keeps the token role as a pre-filter (a tenant costs no query) and then calls `hasAdminAccess`, which reads `role` and `status` by primary key. The `/admin` layout uses the same helper; the dashboard layout derives `isAdmin` from the user row it already fetches. The alternative — a version counter compared on every session read — revokes sessions but still needs a per-request read, so it does not help here.

**One allowlist predicate instead of scattered comparisons.**
`isApprovedStatus`, `isApprovedAccount`, `isAdminRole` and `isApprovedAdmin` in `src/lib/auth/` are the only places that compare against `AccountStatus.APPROVED` or `UserRole.ADMIN`; an ESLint rule enforces that. Failed logins on a deleted account are handled by returning `null` from the `jwt` callback, which Auth.js turns into a cleared cookie.

**Token consumption becomes conditional inside a transaction.**
Both flows now run `updateMany({ where: { id, used/verified: false } })` and act on the changed row count. The alternative of keeping the array transaction leaves a window: the read happens before the transaction, so two requests can both pass.

## Risks / Trade-offs

- **An admin request now costs one extra primary-key read** → accepted; admin traffic is low and the query is covered by an index.
- **A `PENDING` admin created through the admin endpoint loses admin API access until approved** → intended, and the create dialog already defaults to `PENDING` only for tenants.
- **The token still carries a stale `role`, which drives the `/` redirect and document titles** → those are presentation only; the admin area and every admin API re-check the database.
- **A user deleted mid-session is only signed out on the next `update` trigger or sign-in** → closing that fully needs a per-request read, deferred with the revocation work.

## Migration Plan

No schema change and no data migration. Deploy is a plain release; existing tokens remain valid, and the first `sub`-based session read works because Auth.js has always set `sub`.
