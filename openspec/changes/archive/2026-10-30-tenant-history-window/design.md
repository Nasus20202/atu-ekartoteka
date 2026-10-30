# Design

## Context

See proposal.md for motivation. What the code does today:

- **Tenant data loading.** Tenant pages are server components. They load data through cached Prisma queries:
  - `findUserWithApartmentsCached` for the dashboard.
  - `findUserWithApartmentChargesCached` and `findApartmentWithChargesCached` for charges.
  - `findUserWithApartmentPaymentsCached`, `findApartmentWithPaymentsByYearCached` and `findApartmentPaymentYearsCached` for payments.

  None of them filter by date. The current date comes from `getRequestNow()`, which E2E tests can freeze.

- **Charge periods** are stored as `YYYYMM` strings, for example `202501`. A payment row holds one apartment-year.
- **Admin pages** use `requireAdmin()` from `@/lib/auth/require-admin`, `NextResponse.json` with Polish error strings, and client pages with `useState`/`fetch`. See `src/app/api/admin/hoa/route.ts` and `src/app/admin/apartments`.

## Goals / Non-Goals

**Goals:**

- Filter in the database query, so hidden years are never sent to the client.
- Store the window in one place and read it at most once per request.
- Reuse the existing admin API and page patterns.

**Non-Goals:**

- Caching the setting across requests, with revalidation tags or similar. One small read per request is enough.

## Decisions

### 1. Store settings as key/value rows with a typed registry in code

```prisma
model AppSetting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}
```

- Migration: `add_app_setting`. It creates the table only. No rows are seeded; a missing row means the default applies.
- `src/lib/settings/registry.ts` holds `APP_SETTINGS`, one entry per setting with a `defaultValue` and a `parse(value: unknown)` validator. `tenantHistoryYearsBack` uses `parseYearsBack` and `DEFAULT_TENANT_HISTORY_YEARS_BACK = 2` from `src/lib/settings/constants.ts`. Adding a setting means adding an entry there, with no migration.
- `resolveAppSettings(rows)` merges stored rows over the defaults. A stored value that no longer parses, and rows for keys removed from the registry, are ignored.
- `parseAppSettingsUpdate(body)` validates a partial update. It returns null for an empty object, an unknown key or an invalid value.
- `getAppSettings()` in `src/lib/queries/settings/get-app-settings.ts` reads all rows and resolves them. `getAppSettingsCached` wraps it with React `cache()`.
- `updateAppSettings(values)` in `src/lib/mutations/settings/update-app-settings.ts` upserts each given key in one transaction and returns all settings.

The key is the primary key, so each setting exists at most once, and saving one setting never overwrites another.

Alternatives considered:

- **A singleton table with one typed column per setting.** Rejected because every new setting would need a migration, and the fixed `id = 1` column exists only to satisfy Prisma.
- **One row with a single JSON column for all settings.** Rejected because each save rewrites the whole object, so concurrent edits of different settings can overwrite each other.
- **An environment variable or an OpenFeature flag.** Rejected because the admin could not change the value from the app, and OpenFeature would add an SDK, a provider and flagd infrastructure.
- **A per-HOA column.** Rejected because the client asked for one global rule.

### Caching

Settings are cached per request only, through React `cache()`, so a render reads them at most once. The read is a handful of rows from a tiny table. A cross-request cache (`'use cache'` with a tag revalidated on save) is per app instance, so with several instances an admin's change would reach only some of them. Add it only if profiling shows a need.

### 2. Compute the window once and pass `startYear` into the queries

Helpers in `src/lib/utils/history-window.ts`:

- `getHistoryStartYear(now: Date, yearsBack: number): number` returns `now.getFullYear() - yearsBack`.
- `getHistoryStartPeriod(startYear: number): string` returns `${startYear}01`, using the existing period constants and no new literal.

Tenant pages call `getTenantHistoryStartYear()` in `src/lib/settings/tenant-history.ts`. It combines `getRequestNow()` with `getAppSettings()`, so frozen E2E dates work. The result goes to the queries as a primitive `startYear: number` argument, which keeps `react.cache` memoisation intact.

Query changes:

- Charges: `where: { period: { gte: getHistoryStartPeriod(startYear) } }`. A string comparison is valid for `YYYYMM`.
- Payments: `where: { year: { gte: startYear } }`.
- `findApartmentWithPaymentsByYear(apartmentId, userId, year, startYear)`: when `year < startYear`, return `null` before querying. The page then calls `notFound()`.
- `findApartmentPaymentYears(apartmentId, userId, startYear)`: adds `year: { gte: startYear }`.

All six tenant queries become required-argument functions with no default. The compiler then catches any call site that was missed. Admin queries (`find-apartment-detail` and the financial summary) are not touched.

Alternatives considered:

- **Filter in page code after the query.** Rejected because it still transfers and caches hidden data, and a page could easily miss the filter.
- **A Prisma client extension.** Rejected because it is too implicit, and admins share the same models.

### 3. Admin settings API

`src/app/api/admin/settings/route.ts`:

- `GET` returns every setting merged with defaults: `200 { "tenantHistoryYearsBack": 2 }`.
- `PUT` takes a partial object of settings, e.g. `{ "tenantHistoryYearsBack": 1 }`:
  - When every key is known and every value valid (for this setting, an integer in `[0, 20]`), the values are stored and the response is `200` with all settings.
  - An empty body, an unknown key or an invalid value returns `400 { "error": "Nieprawidłowe ustawienia" }`, and nothing is stored.
  - Any other failure returns `500 { "error": "Nie udało się zapisać ustawień", "message": string }`.
- Both handlers use `requireAdmin()`, which returns 401.

`parseYearsBack(value: unknown): number | null` lives next to the constants, so the registry and the form share it.

### 4. Admin settings page

`src/app/admin/settings/page.tsx` is a `'use client'` page following the admin pattern. It holds:

- a shadcn `Card` with the project `Select` listing 0–20 years (`0 lat`, `1 rok`, `2 lata`…, via `formatCountPl` and `YEAR_FORMS`) and a `Zapisz` button. A select replaces a number input so no typed value needs client-side validation; the API still validates.
- a preview line `Mieszkańcy widzą lata {start}–{current}`, computed client-side with `getHistoryStartYear`
- an `Alert` for success or error

The hook `use-app-settings.ts` handles the load and save. The navbar gets an `{ name: 'Ustawienia', href: '/admin/settings', icon: Settings }` entry.

### 5. No PostgreSQL partitioning

Rough volume: 1,000 apartments × about 10 charge lines × 12 months comes to about 120k charge rows per year. Payments come to about 1k rows per year.

- **Charges.** The window filter reads the existing B-tree index on `Charge(apartmentId, period, externalLineNo)` (from the unique constraint) with a range on `period` under an equality prefix.
- **Payments.** `Payment(apartmentId, year)` serves the payment filter the same way.

Native partitioning by year would require:

- putting `period` or `year` into the primary keys, where today `id` is a cuid
- hand-written SQL migrations that Prisma cannot represent, which would cause schema drift in `prisma migrate dev`
- a maintenance job to create a new partition every year

None of these costs pays off at this data size. Revisit if one table passes about 50M rows or `EXPLAIN` shows sequential scans on these queries.

## Risks / Trade-offs

- [The admin lowers the window and tenants lose access to data they relied on] → The data is not deleted, raising the value restores it immediately, and the settings page preview shows the visible years before saving.
- [In January, with `yearsBack = 0`, the dashboard charge trend and balance chart show almost nothing] → This is the expected result of the admin's choice. The existing chart fallback copy ("not enough history") handles it.
- [A missed tenant query keeps showing old data] → `startYear` is a required argument on all tenant queries, and the E2E test checks every tenant page against a seeded old year.
- [The opening balance of the oldest visible year includes the history from hidden years] → This is intended: the balance carried forward is still correct. Only the older rows are hidden.

## Migration Plan

1. Deploy the migration `add_app_settings` (additive, so it is safe to run first).
2. Deploy the app. With no settings row, the default is 2, so tenants immediately see only the last 3 calendar years.
3. Rollback: revert the app. The table can stay, and the old code ignores it.
