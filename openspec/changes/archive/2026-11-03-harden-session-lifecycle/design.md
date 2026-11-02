# Design

## Context

- Sessions are stateless JWTs (`strategy: 'jwt'`); the token carries `sub` and `mustChangePassword`. The `jwt` callback re-reads the user only on `trigger === 'update'`, and returns `null` when the row is gone.
- `DashboardLayout` already loads the user with `findUserByIdCached` and passes it to `isApprovedAdmin`; for a deleted account the value is `null` and the layout renders anyway. `AdminLayout` redirects a non-admin, including a deleted user, to `/dashboard`, so the dashboard layout is the single place that needs the check.
- `/login` redirects an authenticated session to `/`, so a plain `redirect('/login')` from a layout loops while the cookie is still valid. Server Components cannot clear the session cookie, so the sign-out must run on the client.
- `src/app/layout.tsx` already mounts `SessionProvider`, so `useSession().update()` and `signOut` update client state.
- The image is built once in CI and pushed under several tags (`skopeo copy`), then promoted by tag in `atu-infrastructure`. 3 replicas use `RollingUpdate` with `maxSurge: 1`.
- `change-password/actions.ts` is the only `'use server'` file; it only calls `update({})` and redirects.

## Goals / Non-Goals

**Goals:**

- A deleted user's session ends on the next dashboard request without a redirect loop.
- Logout and the post-password-change flow navigate on the client with no full reload.
- Browsers on an older build are reloaded instead of erroring during a rolling update.
- The unarchived-change check cannot be skipped by a lint cache.

**Non-Goals:**

- No change to the JWT shape or the proxy's token-based redirect.
- No new auth endpoint or DB field.
- No cache layer (deferred).

## Decisions

1. **`OrphanedSessionSignOut` client component rendered by `DashboardLayout` when the user is `null`.** It calls the same `useLogout` hook as the button on mount and renders nothing, and the layout renders it instead of `children`. Alternatives: a `/logout` route handler (needs a proxy allowlist entry and a hard redirect), or `redirect('/login')` (loops). `AdminLayout` is unchanged because it already sends a missing user to `/dashboard`.

2. **`useLogout` hook** in `src/components/account/use-logout.ts` returns `{ logout, pending }`. `logout` runs `signOut({ redirect: false })`, then `router.replace('/login')` and `router.refresh()`; `pending` is cleared in `finally`, so a failed request re-enables the button and does not navigate. `signOut` with `redirect: false` clears the cookie and updates `SessionProvider`; `refresh()` drops cached server-rendered data of the previous user.

3. **Session refresh on the client.** `ChangePasswordPage` calls `useSession().update()` after the `PATCH /api/user/profile` succeeds, then `router.replace('/dashboard')` and `router.refresh()`. `update()` posts to `/api/auth/session`, which is on the proxy allowlist; the `jwt` callback ignores any client payload and re-reads `mustChangePassword` from the database, so nothing sent by the client is trusted. Deleting the Server Action removes the Server Action ID and encryption-key concerns entirely.

4. **`deploymentId: process.env.DEPLOYMENT_ID || undefined`** in `next.config.ts`. Next.js inlines it at build time, so the value is a Docker `ARG`/`ENV` in the builder stage, and `build-args: DEPLOYMENT_ID=${{ github.sha }}` in the CI build step. One build produces one ID for every tag of the image. Unset locally, which keeps dev and E2E unchanged. Alternative: the package version; rejected because several commits can share it.

5. **CI shell step instead of an ESLint rule.** `find openspec/changes -mindepth 1 -maxdepth 1 -type d ! -name archive` in the lint job, before ESLint, with a GitHub `::error::` annotation listing the names. The ESLint rule attached the verdict to `eslint.config.mjs`; ESLint's cache keys on file content and config, so a restored cache skipped the rule (reproduced: exit code 0 with an open change). Trade-off: local `pnpm lint` no longer reports open changes; the pre-commit hook does not either.

6. **Wording only for `mustChangePassword`.** The only place the flag grants something (skipping the current-password check in `PATCH /api/user/profile`) already reads the database. `AGENTS.md`, `openspec/config.yaml` and the specs now say the token flag is a redirect hint. `openspec/config.yaml` also still says the session includes role and status; correct it to match the spec.

## Risks / Trade-offs

- **Client-side sign-out is not a hard guarantee.** If JavaScript fails to run, the deleted user sees the empty layout; data stays safe because every query is scoped by `session.user.id`.
- **`router.replace` after `update()` may hit a stale client router cache** for `/dashboard`. `router.refresh()` follows it; the E2E change-password flow verifies the redirect.
- **`deploymentId` forces a reload on mismatch**, losing unsaved component state in an open tab during a deploy. Accepted over a broken navigation.
- **The CI check runs only in CI.** A local commit with an open change is caught at PR time, not before.
