# Tasks

## 1. Measurement baseline

- [x] 1.1 Seed a local database with the perf dataset and record time to first byte and full render of `/dashboard` on current `main` (results in design.md).

## 2. Request-time shell

- [x] 2.1 Remove `runtime` segment config and make the build pass with streamed pages (Cache Components was tried and dropped, section 12).
- [x] 2.2 Add `getSession` (with `connection()`) with a unit test; use it across layouts, pages and sections.
- [x] 2.3 Add `DashboardChrome`, `DashboardNavbarSkeleton`, `Skeleton` and `/dashboard/loading.tsx`; chrome and layout tests cover signed-out redirect and deleted user.

## 3. Streamed pages

- [x] 3.1 Split `/dashboard` into six sections with loaders and skeletons; tests per section, loaders and page composition.
- [x] 3.2 Split charges, per-apartment charges, payments, payment detail and profile into streamed sections; tests for loaders and per-page fallbacks.
- [x] 3.3 Stream `/admin` behind `AdminAccessGuard` and `/` behind `RootRedirect`; tests for guard, redirect and layout.
- [x] 3.4 Make `/api/config/*` and `TrackingScript` request time; tests updated.

## 4. Settings cache

- [x] 4.1 Cache `getAppSettingsCached` with `use cache`, tag and profile; expire the tag in `updateAppSettings`; unit tests.
- [x] 4.2 Measure with and without the settings cache (design.md).

## 5. Verification

- [x] 5.1 Make E2E locators visibility-aware and wait for streamed content; the full E2E suite (345 tests) passes.
- [x] 5.2 Capture screenshots and a video of the loading states.
- [x] 5.3 Open one PR (#848).

## 6. Static titles

- [x] 6.1 Replace `generateMetadata` on the four dynamic-segment pages with static titles; delete `page-titles.ts` and its tests.
- [x] 6.2 Update the metadata unit tests and the E2E title assertions; confirm the dev overlay no longer reports a blocking route and clicks show a skeleton at once (checked on a production build).

## 7. Lazy charts (measure, then decide)

- [x] 7.1 Record the recharts chunk size (gzipped), dashboard first paint, hydration and charges timing with `next/dynamic` at 2, 30 and 60 ms simulated DB round trip (design.md).
- [x] 7.2 Replace the three `Lazy*` wrappers with direct imports on a branch; move the reserved height onto `MeasuredChart`; re-measure.
- [x] 7.3 Decision: keep the lazy wrappers (design.md, Lazy charts measurement); no spec change.

## 8. Admin pages as streamed server pages

- [x] 8.1 Add skeletons and loaders; convert the settings, HOA list, HOA apartments, apartment details and users pages to sync pages with `Suspense` sections; keep import and bulk account pages client-driven with skeletons.
- [x] 8.2 Keep search, edit, pagination and upload as client leaves; delete `LoadingCard` and the spinner cards.
- [x] 8.3 Delete GET routes that lost their last caller, with tests (settings, apartment detail); list them in design.md.
- [x] 8.4 Update unit, E2E and visual tests; the full E2E suite passes.

## 9. Server Actions

- [x] 9.1 Add `requireUserAction` / `requireAdminAction` and extend `require-api-auth-guard` (and a no-inline-action rule) to `'use server'` modules, with tests.
- [x] 9.2 Move settings, HOA rename and apartment status to module-level actions; delete the matching routes and tests.
- [x] 9.3 `serverActions.allowedOrigins` needs no configuration (the gateway preserves `Host`, no URL rewrite); checked on staging. No encryption key is needed (module-level actions only).
- [x] 9.4 Update `AGENTS.md` and the `tenant-history-window` delta for the action boundary and the removed settings route (the other specs name no removed route).

## 10. Performance tests

- [x] 10.1 Run k6 on `main` and on the branch against `docker-compose.e2e.yaml` and compare per-endpoint p95 (design.md).
- [x] 10.2 Update `perf/scenarios`, `perf/lib/thresholds.ts` and the page check (body marker); remove thresholds of deleted routes.
- [x] 10.3 Limits stay as they are: the final build passes every threshold locally. Fix the 3x versus 1.5x wording (spec delta). Confirm the limits on CI.

## 11. Verification

- [x] 11.1 `pnpm lint`, unit tests, build, full E2E and the k6 run pass.
- [x] 11.2 Measure the final timings locally (design.md), then archive the change to sync `openspec/specs`.

## 12. Drop Cache Components

- [x] 12.1 Measure the same code with and without Cache Components, and profile the server (design.md).
- [x] 12.2 Remove `cacheComponents` and `partialPrefetching`, replace the `'use cache'` settings cache with an in-memory entry cleared on save, and add route `loading.tsx` files with tests.
- [x] 12.3 Re-run unit tests, build, the full E2E suite, client navigation timing and k6 on the final build.

## 13. Remaining mutations as actions

- [x] 13.1 Move user status, user creation, bulk create, bulk assign, the profile and password update and the verification resend to actions; delete their routes and route tests, drop `/api/user/profile` from the forced-password-change allowlist.
- [x] 13.2 Replace the E2E calls to the removed routes with database fixtures and an action-response helper; the import POST stays a route (design.md).

## 14. Admin list rendering

- [x] 14.1 Mirror the list view choice in a cookie and render it on the server, with table skeletons and fade-in sections.
- [x] 14.2 Make the initial-fetch skips safe under React strict mode.

## 15. Client reads with SWR

- [x] 15.1 Add `swr`, the shared options, `fetchJson` and `SwrScope`; rebuild `useInfiniteList` on `useSWRInfinite`.
- [x] 15.2 Move the pending count, apartment picker, HOA list, notices, stats, setup status and Turnstile config hooks to SWR.
- [x] 15.3 Reset SWR's cache in the unit test setup; update the specs, `openspec/config.yaml` and `AGENTS.md`.
