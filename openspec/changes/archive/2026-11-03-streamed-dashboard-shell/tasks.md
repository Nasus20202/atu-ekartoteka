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
- [x] 5.3 Sync `openspec/specs` by archiving the change and open one PR.
