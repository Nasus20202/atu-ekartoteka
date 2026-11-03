# Tasks

## 1. Measurement baseline

- [x] 1.1 Seed a local database with the perf dataset and record time to first byte and full render of `/dashboard` on current `main` (results in design.md).

## 2. Cache Components and shell

- [x] 2.1 Enable `cacheComponents` and `partialPrefetching`; remove `runtime` segment config; `pnpm build` passes.
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

- [ ] 6.1 Replace `generateMetadata` on the four dynamic-segment pages with static titles; delete `page-titles.ts` and its tests.
- [ ] 6.2 Update the metadata unit tests and the E2E title assertions; confirm the dev overlay no longer reports a blocking route and clicks show a skeleton at once (checked on a production build).

## 7. Lazy charts (measure, then decide)

- [ ] 7.1 Record the recharts chunk size (gzipped), dashboard first paint, hydration and charges timing with `next/dynamic` at 2, 30 and 60 ms simulated DB round trip (design.md).
- [ ] 7.2 Replace the three `Lazy*` wrappers with direct imports on a branch; move the reserved height onto `MeasuredChart`; re-measure.
- [ ] 7.3 Decide on the numbers. If kept, delete the wrappers and `ChartPlaceholder`, update tests and E2E, and add the `charges-and-payments` delta; if reverted, record why.

## 8. Admin pages as streamed server pages

- [ ] 8.1 Add skeletons and loaders; convert the HOA list, HOA apartments, apartment details, users, user management, settings and import pages to sync pages with `Suspense` sections.
- [ ] 8.2 Keep search, edit, pagination and upload as client leaves; delete `LoadingCard` and the spinner cards.
- [ ] 8.3 Delete GET routes that lost their last caller, with tests; list them in design.md.
- [ ] 8.4 Update unit, E2E and visual tests; the full E2E suite passes.

## 9. Server Actions

- [ ] 9.1 Add `requireUserAction` / `requireAdminAction` and extend `require-api-auth-guard` (and a no-inline-action rule) to `'use server'` modules, with tests.
- [ ] 9.2 Move the admin and profile mutations to module-level actions with validated input, page by page; delete the matching routes and tests.
- [ ] 9.3 Check `serverActions.allowedOrigins` on staging behind the gateway; confirm no encryption key is needed.
- [ ] 9.4 Update `AGENTS.md`, `frontend-dto-boundaries`, `code-style`, `user-management`, `hoa-management` for removed routes and the action boundary.

## 10. Performance tests

- [ ] 10.1 Run k6 on `main` and on the branch against `docker-compose.e2e.yaml` and compare per-endpoint p95 (design.md).
- [ ] 10.2 Update `perf/scenarios`, `perf/lib/thresholds.ts` and the page check (body marker); remove thresholds of deleted routes.
- [ ] 10.3 Re-baseline limits from the CI run, fix the 3x versus 1.5x wording, and keep the Grafana dashboard queries valid.

## 11. Verification

- [ ] 11.1 `pnpm lint`, unit tests, build, full E2E and the k6 run pass.
- [ ] 11.2 Measure the final timings locally and on staging (design.md), then archive the change to sync `openspec/specs` and update the PR description.
