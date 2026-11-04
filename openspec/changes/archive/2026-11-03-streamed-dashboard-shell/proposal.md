# Proposal

## Why

Every dashboard request waited for the session decode and a user lookup in the
layout before any HTML was sent, so a page showed nothing until its whole
server render finished. Staging runs 3 replicas with no shared cache, so
caching per-user data does not pay off (see design.md). Streaming the layout and each
section behind its own boundary at request time improves time to first byte and
first paint without shared state.

## What Changes

- Pages render a static layout and stream each data section at request time. Cache
  Components and partial prefetching were tried and dropped: they cost about 25% of
  throughput and delayed the content (design.md). Every data route has a
  `loading.tsx` with its own skeleton, so client navigation shows the page at once.
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
  request-scoped `getSession`.
- A deleted user is handled by rendering the sign-out component instead of
  redirecting, which would loop through `/login`.
- Runtime-env readers (`/api/config/*`, `TrackingScript`) opt into request time so
  their values are not frozen into the build.
- Global app settings are cached in memory per replica for 5 minutes, tagged
  `app-settings`, and the save path expires the tag.
- E2E tests use visibility-aware locators and wait for streamed content.
- Pages whose title needed the session and a database lookup (admin HOA and
  apartment pages, tenant per-apartment charges and payment year pages) use a
  static title, because that lookup blocks the navigation until it resolves.
- The three `next/dynamic` chart wrappers and `ChartPlaceholder` are removed if
  measurement shows the lazy loading no longer pays off with streamed sections.
- The seven admin pages become server pages that stream their initial list in
  `Suspense` sections with skeletons; search, edit, pagination and upload stay
  client leaves. Spinner cards (`LoadingCard`) are removed.
- Server Actions replace every admin, profile and account mutation route, behind a
  shared action guard enforced by lint. Routes that stay: auth, health, config,
  setup/check, import, the public auth flows and the read routes.
- Client reads (search, paging, pickers, config) use SWR through those read routes;
  the admin lists render the remembered cards or table view on the server.
- The k6 scenarios, checks and thresholds follow the new page and route shape.
- **BREAKING (behaviour):** tab titles of four dynamic-segment pages lose the
  HOA name or apartment address; removed API routes stop responding; `runtime` segment config is removed from two routes;
  a missing or foreign record now responds with `notFound()` after the response
  started, so the HTTP status is 200 instead of 404.

## Capabilities

### New Capabilities

### Modified Capabilities

- `tooling`: request-time streaming, request-time runtime config, module-level Server Actions, client reads with SWR.
- `page-titles`: dynamic-segment pages use static titles.
- `charges-and-payments`: charts no longer loaded on demand (after measurement).
- `performance-testing`: scenarios, checks and limits for streamed pages and removed routes.
- `frontend-dto-boundaries`, `code-style`, `user-management`, `hoa-management`: references to
  removed API routes and the server action boundary.
- `visual-design`: streamed sections with skeletons and fade-in on every page; the remembered list view is rendered on the server.
- `tenant-history-window`: app settings are cached and invalidated on save.
- `authentication`: protected content renders only after the database access check; every
  Server Action resolves the caller through a shared guard.
- `testing`: E2E locators tolerate streamed content.

## Non-Goals

- Caching user, apartment, charge or payment data.
- A shared cache (Valkey) or sticky sessions.
- Changing the public auth routes, health, config, setup/check and import routes.
- Setting `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: actions are module-level, so no closure is encrypted (see design.md).
- Pagination or search redesign of the admin pages.

## Impact

- `next.config.ts`, `src/app/**` pages and layouts, `src/components/**` sections and
  skeletons, `src/lib/auth/`, `src/lib/queries/settings/`, `src/lib/mutations/settings/`,
  `src/app/api/config/`, `e2e/`.
- Measured effect on throughput and timings is recorded in design.md.
