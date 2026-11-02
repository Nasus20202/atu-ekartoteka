# Proposal

## Why

Several gaps remain in how a session starts, ends and survives a rolling
deploy, found while reviewing recent authentication work:

- A user whose row was deleted keeps a working session until the JWT expires:
  the sign-out on a missing user only runs on the session `update` trigger.
- Logout and the post-password-change flow trigger full page navigations, and
  the latter relies on the app's only Server Action.
- Production runs 3 replicas with rolling updates but sets no deployment ID, so
  a browser tab opened on the previous build can hit a new pod and fail on
  navigation or on a Server Action ID it no longer knows.
- The `mustChangePassword` token flag is described as if it were enforced, but
  it is only a redirect hint; the database is authoritative wherever the flag
  grants something.
- The "no unarchived OpenSpec change" check ran as an ESLint rule on
  `eslint.config.mjs`. CI runs ESLint with `--cache`, so a newly added change
  folder does not invalidate the cached result and the check silently passed.

## What Changes

- Dashboard layout signs out a session whose user no longer exists, via a small
  client component, instead of rendering the page for a deleted account.
- Logout (`LogoutButton`) goes through a new `useLogout` hook: `signOut` without
  a redirect, then a client-side `router.replace('/login')` and `router.refresh()`.
  The button is disabled while the request runs.
- The change-password page refreshes the session with `useSession().update()`
  and navigates client-side. The `change-password/actions.ts` Server Action is
  removed, so the app has no Server Actions.
- `next.config.ts` sets `deploymentId` from the `DEPLOYMENT_ID` env var. The
  Dockerfile takes it as a build arg and the CI image build passes the commit SHA.
- The `mustChangePassword` wording in `AGENTS.md`, `openspec/config.yaml` and the
  specs says the token flag is a redirect hint only.
- **BREAKING (tooling):** the `local/no-unarchived-openspec-changes` ESLint rule
  is removed. A shell step in the CI lint job fails the build when any folder
  other than `archive/` exists under `openspec/changes/`. Local `pnpm lint` no
  longer reports open changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `authentication`: Session Management (orphaned-session sign-out, client-side
  session refresh, logout without a page reload) and Forced Password Change
  Redirect (token flag is a redirect hint; no Server Action).
- `tooling`: Next.js (deployment ID for version-skew protection) and a new
  requirement for the CI check on unarchived OpenSpec changes.

## Impact

- Code: `src/app/dashboard/layout.tsx`, `src/app/change-password/page.tsx`,
  `src/components/account/` (new `use-logout.ts`, `orphaned-session-sign-out.tsx`,
  updated `logout-button.tsx`), `next.config.ts`, `docker/Dockerfile`,
  `.github/workflows/test-and-build.yaml`, `eslint.config.mjs`, `eslint-rules/`.
- Removed: `src/app/change-password/actions.ts` and its test, the ESLint rule
  and its test.
- Docs: `AGENTS.md`, `openspec/config.yaml`, the `authentication` and `tooling` specs.
- No database or API contract changes.

## Non-goals

- Server-side caching (Cache Components, Redis cache handler) is deferred.
- Setting `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: the app has no Server Actions
  after this change and all replicas run one image.
- Single-use or stateful registration auto-login grants.
- Checking `mustChangePassword` against the database in the proxy.
