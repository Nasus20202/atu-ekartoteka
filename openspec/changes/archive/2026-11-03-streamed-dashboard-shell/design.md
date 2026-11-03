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
- Streaming the data of client-side admin pages.

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
- Settings can be stale on other replicas for up to 5 minutes → bounded lifetime.
