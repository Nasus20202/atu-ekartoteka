# Tasks

## 1. App settings storage

- [x] 1.1 Add the key/value `AppSetting` model to `prisma/schema.prisma` and generate migration `add_app_setting` with `pnpm prisma migrate dev`. Verify that the migration SQL only creates the new table and that `prisma generate` succeeds.
- [x] 1.2 Add `src/lib/settings/constants.ts` (`DEFAULT_TENANT_HISTORY_YEARS_BACK`, `MIN_`/`MAX_TENANT_HISTORY_YEARS_BACK`, `parseYearsBack`) and the `src/lib/settings/registry.ts` setting registry (`resolveAppSettings`, `parseAppSettingsUpdate`). Unit tests in `src/lib/settings/__tests__` cover integers 0–20, negatives, values above 20, decimals, strings, null, defaults, invalid stored values, and unknown or inherited keys.
- [x] 1.3 Add `getAppSettings` in `src/lib/queries/settings/`, cached and falling back to the default. Add `updateAppSettings` in `src/lib/mutations/settings/`, which upserts each given key in one transaction. Unit tests with mocked Prisma cover the defaults when there are no rows, the stored value, and the upsert arguments.

## 2. History window helpers and tenant queries

- [x] 2.1 Add `getHistoryStartYear` and `getHistoryStartPeriod` in `src/lib/utils/history-window.ts`. Add `getTenantHistoryStartYear()` in `src/lib/settings/tenant-history.ts`, built on `getRequestNow` and `getAppSettings`. Unit tests cover yearsBack 0 and 2, January edge dates, and the `YYYY01` period format.
- [x] 2.2 Add a required `startYear` argument to these tenant queries:
  - `findUserWithApartments`
  - `findUserWithApartmentCharges`
  - `findApartmentWithCharges`
  - `findUserWithApartmentPayments`
  - `findApartmentWithPaymentsByYear`, which returns null without querying when `year < startYear`
  - `findApartmentPaymentYears`

  Update `user-queries.test.ts`, `apartment-queries.test.ts` and `find-apartment-payment-years.test.ts` to assert the `where` filters and the early null. Verify with `pnpm vitest --run src/lib/queries`.

- [x] 2.3 Pass `getTenantHistoryStartYear()` from every tenant page: `/dashboard`, `/dashboard/charges`, `/dashboard/charges/[apartmentId]`, `/dashboard/payments` and `/dashboard/payments/[apartmentId]/[year]`. Update `src/app/dashboard/__tests__/page.test.tsx` and the other affected page tests. Verify that `pnpm tsc --noEmit` passes with no missed call sites.

## 3. Admin settings API and page

- [x] 3.1 Implement `GET` and `PUT` in `src/app/api/admin/settings/route.ts` using `requireAdmin`, `parseYearsBack` and the response shapes from design.md. Route tests in `__tests__/route.test.ts` cover a 200 GET, a 200 PUT, a 400 for an invalid value, an unknown key or an empty body, 401/403 for non-admins, and a 500.
- [x] 3.2 Build `src/app/admin/settings/page.tsx` with a `use-app-settings.ts` hook. The page has a number input, a `Zapisz` button, a preview of the visible years, and a success/error `Alert`, with Polish copy from the spec. Add the `Ustawienia` item to the admin navbar. Component tests cover load, a successful save, a validation error, and the preview text.
- [x] 3.3 Add the settings scenarios to `e2e/admin/tenant-history-window.spec.ts`, which runs serially because the setting is global. The admin raises the value to 3 on `/admin/settings`, sees the preview and `Zapisano ustawienia`, and the tenant then sees the year that was hidden. The value is restored to 2 in `finally`. Also check the `Ustawienia` navigation link. Raising the value, rather than lowering it, keeps other tenant tests running in parallel unaffected. Verify with `pnpm playwright test e2e/admin/tenant-history-window.spec.ts`.

## 4. Tenant window E2E

- [x] 4.1 Extend `e2e/utils/create-mixed-payments-user.ts` with `yearsAgo` offsets, adding payments and January charges for those years. In `e2e/admin/tenant-history-window.spec.ts`, seed the current year plus 2 and 3 years ago, and assert that:
  - the 3-years-ago year is absent on the payments and charges pages
  - its payment URL shows the 404 page
  - the year switcher lists only the visible years
  - the admin apartment detail page still shows it

  Verify that the existing dashboard E2E specs still pass.

## 5. Integration checks

- [x] 5.1 Run `pnpm lint`, `pnpm prettier --check .`, `pnpm vitest --run` and the full `pnpm playwright test`. Confirm that no touched file exceeds 200 lines and that visual snapshots changed only where seeded old years are now hidden.

## Workflow follow-up

- Ask the user for approval before the final commit (AGENTS.md).
- Archive the change after review with `/opsx:archive`.
