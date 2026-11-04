# Design

## Context

The app runs on 3 replicas behind random load balancing, with no shared cache.
Pages are per-user: the session cookie is read, then the user is loaded. Role
and status are read from the database on every check (authentication spec).

## Goals / Non-Goals

**Goals:**

- The page shell sent immediately, with data streaming in parallel.
- No change to access-control behaviour.

**Non-Goals:**

- Caching per-user data, Valkey, sticky sessions.
- Replacing the public auth, health, config, setup/check and import routes.

## Decisions

**Streaming comes from `Suspense` at request time, not from Cache Components.**
Pages are synchronous components that compose async sections, each in its own
`Suspense` with a skeleton. Pages pass `params` and `searchParams` down as promises;
reading them in the page body would block the shell. Cache Components with partial
prefetching was built and measured first and then dropped (see the comparison below):
it prerenders a shell but costs about 25% of throughput and shows the content later.

**Route loading states.** Without partial prefetching, a client navigation shows the
prefetched `loading.tsx` of the target route. Every data route has one that mirrors its
static shell (heading and skeletons), so a click shows the page in about 12 ms
instead of the generic dashboard skeleton, and the content follows.
(`/dashboard/loading.tsx` stays as the fallback for routes without their own.)

**Request-scoped loaders.** Sections await only what they render, through
`cache`-memoized loaders (`dashboard-loaders`, `load-apartment-charges`,
`load-payment-details`, `requireApprovedTenant`). Sections that share data share
one query; independent ones (light user, charge totals) do not wait for the heavy
apartments query.

**One session decode per request.** `getSession` wraps `auth()` in React `cache`, so
layouts, pages and sections share one decode and one `connection()` call.

**Admin.** The navbar is static, so it renders at once; the access check moves
into a guard behind a page skeleton, so no protected content renders before it.

**Deleted user.** Redirecting to `/login` loops, so the greeting section renders
`OrphanedSessionSignOut` and the other sections render nothing.

**Request-time env.** `/api/config/*` call `connection()`; `TrackingScript` is async
with `connection()` inside `Suspense`. That also keeps every page dynamic, so
runtime environment values are never frozen into a static page at build time.

**Only global settings are cached.** A module-level entry with a 5 minute lifetime,
cleared on save on the replica that handled it (`'use cache'` would need Cache
Components). Per-user caches were rejected: with 3 replicas a user's hit rate over k
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

**Admin pages stream their initial data.** The settings, HOA list, HOA apartments,
apartment details and users pages are sync server pages: a section behind
`Suspense` loads the first data through the same query code the API routes use
(`loadApartmentsPage`, `loadApartmentDetail`, `loadUsersPage`) after
`requireAdminAccess()` (memoized with the layout guard) and hands it to a client
content component as initial data. Search, filters and infinite scroll stay
client-side and read the existing JSON routes through SWR (`useSWRInfinite`, `useSWR`
with the shared options in `src/lib/swr`). The first page the server loaded is the
hook's `fallbackData`, also put in the cache so loading more does not request it
again, and each list sits in a `SwrScope` (an SWR cache that dies with the mount) so
a revisit never shows an older cached page instead of fresh server data. The server
chooses the list view from a cookie that mirrors the browser setting, so the page and
its loading fallback render the table or the cards the admin picked. The HOA
apartments filters update the URL with `history.pushState` so a search does not
re-render the server page as well. The import and bulk account pages stay client-driven tools (their data
depends on local mode and selection state, and the import statistics are slow
counts that must not delay the form); their spinners became skeletons. The
spinner card (`LoadingCard`) is deleted.

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
`serverActions.allowedOrigins` needs no configuration: the gateway preserves `Host` and
does not rewrite the URL, so the origin check compares equal values. A settings save
after the first staging deploy confirms it.

All mutations are actions now: settings, HOA rename, apartment status, user status,
user creation, bulk create, bulk assign, the profile and password update, and the
verification resend. Their routes and route tests were replaced by action tests; the
import POST stays a route because its gzip+base64 body would need a global
`bodySizeLimit` above the 1 MB default. Reads stay routes: Next's docs and
maintainers call actions "designed for mutations" that "run one at a time", with no
abort, which type-ahead and parallel widgets cannot accept. GET routes that no page
calls any more (`/api/admin/settings`, `/api/admin/apartments/[id]`) were deleted.

**Client reads use SWR, from the stable API.** The SWR docs recommend `preload` with
`SWRConfig cacheData` for server-loaded data, but that exists only in `swr@2.6.0-beta`;
the stable `2.5.1` offers `fallbackData`, which is what the lists use. Hooks live only
in client components, `SWRConfig` (`SwrScope`) is a client component. SWR does not
abort a request, so a stale response is ignored instead of cancelled.

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

## Cache Components compared with request-time streaming

The same section code, production builds, 1,000 tenants and 2M charges, 30 cold
loads of `/dashboard`, medians in ms. "PPR" is `cacheComponents` and
`partialPrefetching`; "stream" is request-time streaming.

| DB RTT | Variant | TTFB | FCP | Greeting | All sections | LCP | req/s |
| ------ | ------- | ---- | --- | -------- | ------------ | --- | ----- |
| ~0     | PPR     | 3.5  | 52  | 37       | 188          | 408 | 69    |
| ~0     | stream  | 6.1  | 56  | 28       | 36           | 272 | 93    |
| 2 ms   | PPR     | 3.5  | 48  | 32       | 180          | 400 | 74    |
| 2 ms   | stream  | 6.1  | 48  | 23       | 150          | 248 | 91    |

A CPU profile under the same load shows about 10 ms of CPU per request on `main`
and about 15 ms with PPR, almost all of the difference in Next/React rendering
(3.3 to 5.1 ms) and stream writes (2.0 to 3.4 ms); database time per request is
unchanged. Client navigation from `/dashboard` to charges at 30 ms DB RTT: `main`
waits 157-180 ms for the server, PPR shows the page in 13 ms, request-time streaming
with the route `loading.tsx` files in 12 ms (without them it showed only the generic
skeleton and the heading arrived with the data, after about 310 ms).

Final build, 50 tenant users in k6 (all thresholds pass, no dropped iterations):
`/dashboard` p95 65 ms against 52 on `main`, tenant journey average 26 ms against 20,
public pages average 4.7 ms against 2.1, 602 MB received against 422 MB. The PPR
build had failed the public-page and dropped-iteration thresholds (dashboard p95 256 ms).
Dashboard at 2 ms DB RTT: TTFB 6 ms against 28 on `main`, first paint 48 ms against 116,
LCP 252 ms against 308, 92 requests per second against 99.

## Measured results (partial prerender variant, superseded)

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

## Lazy charts measurement

`/dashboard` on a production build, 30 cold loads per cell (median, ms), recharts
chunk 370 KB raw and 108 KB gzipped. "Lazy" keeps the `next/dynamic` wrappers, "static"
imports the charts directly.

| Condition    | Variant | FCP | All sections | LCP     | Load    |
| ------------ | ------- | --- | ------------ | ------- | ------- |
| 2 ms RTT     | lazy    | 52  | 162-185      | 324-412 | ~100    |
| 2 ms RTT     | static  | 52  | 180-218      | 320-324 | 157-193 |
| 30 ms RTT    | lazy    | 92  | 453          | 384     | 188     |
| 30 ms RTT    | static  | 48  | 468          | 384     | 223     |
| 2 ms, 4x CPU | lazy    | 120 | 388          | 388     | 369     |
| 2 ms, 4x CPU | static  | 116 | 445          | 372     | 443     |

Throughput is the same (about 70 req/s at 2 ms). Removing the wrappers does not
improve first paint, does not remove the late charges section (so the wrapper is
not the cause of the ~300 ms delay) and delays the load event by 35-90 ms and the last
section by 15-60 ms because the chunk is on the critical path. The wrappers stay.

## Risks / Trade-offs

- Streaming costs about 7% of throughput against `main` (92 against 99 requests per
  second) and sends about 40% more bytes → watch CPU on staging (requests 50m).
- A page's own heading and layout now arrive with the first chunk, but the content
  still arrives later than `main` on a very fast server; measure real users.
- A streamed section can exist twice in the DOM for a moment right after navigation
  → tests use visibility-aware locators and wait for streamed content.
- `notFound()` and redirects after the response started do not change the HTTP
  status → acceptable for authenticated pages.
- Removing the HOA/apartment names from tab titles is a visible behaviour change.
- Server Actions widen the public POST surface → guard in every action, enforced by lint.
- Admin pages now carry their first data in the page request, so their k6 durations
  rise; the final build stays inside every limit locally, to be confirmed on CI.
- Settings can be stale on other replicas for up to 5 minutes → bounded lifetime.
