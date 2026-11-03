# Design

## Context

The app runs on 3 replicas behind random load balancing, with no shared cache.
Pages are per-user: the session cookie is read, then the user is loaded. Role
and status are read from the database on every check (authentication spec).

## Goals / Non-Goals

**Goals:**

- A prerendered shell delivered immediately, with data streaming in parallel.
- No change to access-control behaviour.

**Non-Goals:**

- Caching per-user data, Valkey, sticky sessions.
- Replacing the public auth, health, config, setup/check and import routes.

## Decisions

**Streaming comes from Cache Components with partial prefetching.** Pages are
synchronous components that compose async sections, each in its own `Suspense`
with a skeleton. Pages pass `params` and `searchParams` down as promises; reading
them in the page body would block the shell.

**Request-scoped loaders.** Sections await only what they render, through
`cache`-memoized loaders (`dashboard-loaders`, `load-apartment-charges`,
`load-payment-details`, `requireApprovedTenant`). Sections that share data share
one query; independent ones (light user, charge totals) do not wait for the heavy
apartments query.

**One session decode per request.** `getSession` wraps `auth()` in React `cache`
and calls `connection()` first: Auth.js generates a CSRF token with
`crypto.getRandomValues()`, which Next rejects in a prerender.

**Admin.** The navbar is static, so it renders at once; the access check moves
into a guard behind a page skeleton, so no protected content renders before it.

**Deleted user.** Redirecting to `/login` loops, so the greeting section renders
`OrphanedSessionSignOut` and the other sections render nothing.

**Request-time env.** `/api/config/*` call `connection()`; `TrackingScript` is async
with `connection()` inside `Suspense`. Otherwise the build freezes the values.

**Only global settings are cached.** 5 minute lifetime, tag `app-settings`,
`revalidateTag(tag, { expire: 0 })` on save (`updateTag` works only in Server
Actions). Per-user caches were rejected: with 3 replicas a user's hit rate over k
requests in the window is about 0%, 17%, 30%, 48%, 71% for k = 1, 2, 3, 5, 10, and
each cached query needs tags, invalidation at every write site and a codec.

**Static titles for dynamic routes.** `generateMetadata` that reads the session
and the database blocks the navigation ("Blocking Route"): the click waits for the
lookup before any skeleton is shown. The four affected pages (admin HOA, admin
apartment, tenant charges and payment year per apartment) use a static title;
`page-titles.ts` and its private `cache(() => auth())` copy are deleted. Rejected:
streaming `<title>` from a section (appears late, needs testing against Next's
metadata) and `instant = false` (keeps the wait).

**Lazy charts are re-measured, not assumed.** `MeasuredChart` renders nothing until
the browser has measured it, so the charts never server-render, and a chart that
lives only in a streamed section already gets its chunk when the section arrives.
`next/dynamic` adds a second deferral and a client suspension on first render
(a suspected cause of the unexplained ~300 ms charges delay). Task 7 measures the
recharts chunk, first paint and hydration with and without the wrappers and keeps
them only if removing them is worse. The spec delta is written after that decision.

**Admin pages stream their initial data.** Each page is a sync server page with
`Suspense` sections and skeletons, fed by request-memoized loaders; search, edit,
pagination and upload stay small client leaves. GET routes that lose their last
caller are deleted with their tests.

**Server Actions only for mutations, module-level only.** Actions live in
`'use server'` modules with explicit, validated arguments; inline actions that
capture variables are forbidden. So no closure is encrypted and
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is not set: staging and production run one
image on 3 replicas (same build, same key). The only skew is a rolling deploy with a
stale tab, which `deploymentId` already covers. If closures are ever needed the key
must be a build argument from a CI secret, because it is baked into the build. Every
action calls `requireUserAction` / `requireAdminAction` first (same 401/403 shape as
the route guards) and lint extends `require-api-auth-guard` to `'use server'`
modules. Actions run one at a time per client, so type-ahead search stays a read.
`serverActions.allowedOrigins` is checked on staging behind the gateway.

## Performance test impact

k6 (`perf/`) issues plain HTTP GETs, runs no JavaScript and reads the whole body,
so `http_req_duration` is the time the stream completes, not first paint.

- **Streamed tenant pages.** The shell's TTFB gain is invisible to the limits; what
  shows up is the extra server work: local throughput fell about 28% (101 → 73
  req/s), so the `user_journey` pages should be roughly 30-40% slower at peak (an
  extrapolation; to be measured in the CI-like stack). The limits sit at 1.5x the
  slowest CI p95 (`thresholds.ts`), so the margin is thin: `/dashboard` 540,
  `/dashboard/charges` 560, `/dashboard/payments` 520, `payment details` 630.
- **Admin pages.** Today the HTML is a client-rendered shell and the cost is in the
  JSON routes. After conversion the page request contains the queries, so
  `/admin/*` get slower and the JSON limits move to the page limits. Routes that are
  deleted must leave `admin.ts` and `thresholds.ts` together, or k6 gets 404s and the
  `checks` and `http_req_failed` thresholds fail.
- **Masked failures.** A `redirect()` after the shell was sent keeps status 200, so
  `getPage`'s `200` check no longer catches an expired session. Add a body check
  (no redirect marker, expected landmark text).
- **Faster:** the four title routes drop their session and lookup queries; the
  settings cache removes one query per request.
- **Not covered:** k6 does not run JS, so the chart change and hydration cost are not
  measured by it, and it issues no mutations, so actions get no load coverage. Both are
  measured by hand in tasks 7 and 9.
- **Spec drift to fix:** the performance spec says limits sit at three times the
  CI value, `thresholds.ts` says 1.5 times.
- **Method:** run k6 on `main` and on this branch against `docker-compose.e2e.yaml`,
  compare per-endpoint p95, then set limits from CI, not from a developer machine.

## Measured results

Production build, 1,000 tenants and 2M charges, perf user, 30 cold loads per
cell, 16 parallel connections for throughput; the DB round trip is simulated with
a TCP delay proxy. Browser values are medians in ms.

| DB RTT       | Variant  | TTFB | FCP | Greeting | All sections | req/s |
| ------------ | -------- | ---- | --- | -------- | ------------ | ----- |
| ~0           | baseline | 14   | 64  | 34       | 34           | 101   |
| ~0           | streamed | 3.4  | 56  | 30       | 157          | 73    |
| 2 ms         | baseline | 28   | 76  | 48       | 48           | 97    |
| 2 ms         | streamed | 3.5  | 48  | 33       | 182          | 73    |
| 10 ms        | baseline | 76   | 124 | 95       | 95           | 58    |
| 10 ms        | streamed | 3.5  | 44  | 36       | 187          | 68    |
| 2 ms, 4x CPU | baseline | 27   | 144 | 75       | 75           | 98    |
| 2 ms, 4x CPU | streamed | 3.5  | 120 | 56       | 376          | 74    |

Settings cache, streamed shell only (no sections): it removes one DB round trip
per request: total time 21.4 → 19.1 ms (0 ms), 32.4 → 29.2 (2 ms), 80.7 → 68.6
(10 ms), and throughput 42 → 57 req/s at 10 ms.

Reading: TTFB and first paint improve, but the time until every section is visible
is later than the baseline because the streamed sections are swapped in by the
browser's main thread, which is busy hydrating; the gap grows with CPU slowness
and shrinks only when the server render is slow. Throughput per process drops by
about 28% when the DB is fast.

## Risks / Trade-offs

- Time to all content is worse on fast servers and slow CPUs → measure real users
  before keeping it; revert is two config flags plus the page splits.
- Throughput drops about 28% → watch CPU on staging (requests 50m).
- Visited routes stay mounted but hidden (Activity) → tests use visibility-aware
  locators; transient duplicate content right after navigation.
- `notFound()` and redirects after the response started do not change the HTTP
  status → acceptable for authenticated pages.
- Build logs `HANGING_PROMISE_REJECTION` errors from admin API routes that catch the
  prerender signal in their own `try/catch`; harmless, not changed here.
- Removing the HOA/apartment names from tab titles is a visible behaviour change.
- Server Actions widen the public POST surface → guard in every action, enforced by lint.
- Admin and tenant pages get slower in k6 terms → re-baseline limits from CI.
- Settings can be stale on other replicas for up to 5 minutes → bounded lifetime.
