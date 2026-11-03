# Proposal

## Why

Every dashboard request waited for the session decode and a user lookup in the
layout before any HTML was sent, so a page showed nothing until its whole
server render finished. Staging runs 3 replicas with no shared cache, so
caching per-user data does not pay off (see design.md). Streaming a prerendered
shell behind per-section boundaries improves time to first byte and first paint
without shared state.

## What Changes

- Enable `cacheComponents` and `partialPrefetching` in `next.config.ts`.
- Every tenant page (`/dashboard`, charges, per-apartment charges, payments,
  payment detail, profile) renders a static shell and streams its data sections
  behind separate `Suspense` boundaries, each with a matching skeleton and a
  fade-in when the content arrives. Independent sections load in parallel from
  request-scoped, memoized loaders.
- The dashboard layout no longer reads the session; the navbar and the email
  verification banner stream in behind a navbar skeleton.
- `/admin` renders its (static) navbar at once and checks admin access in a guard
  behind a page skeleton; `/` redirects from a streamed component. The explicit
  prerender opt-outs are no longer needed.
- Layouts and pages share one session decode per request through a
  request-scoped `getSession`, which opts out of prerendering first.
- A deleted user is handled by rendering the sign-out component instead of
  redirecting, which would loop through `/login`.
- Runtime-env readers (`/api/config/*`, `TrackingScript`) opt into request time so
  their values are not frozen into the build.
- Global app settings are cached in memory per replica for 5 minutes, tagged
  `app-settings`, and the save path expires the tag.
- E2E tests use visibility-aware locators and wait for streamed content.
- **BREAKING (behaviour):** a client navigation keeps the previous route mounted but
  hidden (React Activity); `runtime` segment config is removed from two routes;
  a missing or foreign record now responds with `notFound()` after the response
  started, so the HTTP status is 200 instead of 404.

## Capabilities

### New Capabilities

### Modified Capabilities

- `tooling`: Cache Components, request-time runtime config.
- `visual-design`: streamed sections with skeletons and fade-in on every page.
- `tenant-history-window`: app settings are cached and invalidated on save.
- `authentication`: protected content renders only after the database access check.
- `testing`: E2E locators tolerate streamed content.

## Non-Goals

- Caching user, apartment, charge or payment data.
- A shared cache (Valkey) or sticky sessions.
- Making admin pages (client components that fetch from the API) stream their data.

## Impact

- `next.config.ts`, `src/app/**` pages and layouts, `src/components/**` sections and
  skeletons, `src/lib/auth/`, `src/lib/queries/settings/`, `src/lib/mutations/settings/`,
  `src/app/api/config/`, `e2e/`.
- Measured effect on throughput and timings is recorded in design.md.
