# Proposal

## Why

Tenants see every charge and payment year that was ever imported. Older years are noise for them, and the client wants tenants to see only the most recent full calendar years. Admins must still see the full history, and the client wants to control how many years tenants see.

## What Changes

- **Tenant history window.** Tenant views show only the current calendar year plus the N previous full years. N defaults to 2, so in 2027 a tenant sees 2027, 2026 and 2025.
  - The window applies to charges, payments, the payment year switcher, and the dashboard charts and balances.
  - Opening a hidden payment year by URL returns a 404.
  - Nothing is deleted. Admin views are not filtered.
- **Admin setting.** A new `/admin/settings` page ("Ustawienia") lets the admin set N.
  - The value is stored in a new key/value `AppSetting` table, so later settings need no migration.
  - It is exposed through `GET/PUT /api/admin/settings`.

## Non-goals

- **PostgreSQL table partitioning.** We analysed it and do not recommend it. The data is small: charges are about 10 rows per apartment per month, and payments are one row per apartment per year. The existing unique indexes `(apartmentId, period, externalLineNo)` and `(apartmentId, year)` already serve the year filter. Partitioning would also mean hand-written SQL migrations, because Prisma does not model partitions. See design.md.
- Deleting or archiving old data.
- A separate window setting for each HOA. There is one global setting.
- The current-notice PDF, admin year grouping and the dashboard "Wpłaty" label. These are in the separate change `tenant-notice-pdf-and-year-grouping`.

## Capabilities

### New Capabilities

- `tenant-history-window`: an admin-configurable number of previous full calendar years visible to tenants, and how that window applies to tenant charge and payment data.

### Modified Capabilities

- `charges-and-payments`: the payment year switcher lists only the years inside the window.

## Impact

- **DB:** a new `AppSetting` model (key/value) and migration. Existing tables are not changed.
- **Queries:** the tenant queries in `src/lib/queries/users/*` and `src/lib/queries/apartments/*` (charges, payments and payment years) take a required `startYear` argument.
- **API:** a new `src/app/api/admin/settings/route.ts`.
- **UI:** a new `src/app/admin/settings` page, a new navbar item, and every tenant page passes the window to its queries.
- **Tests:**
  - Unit tests for the window helper, the queries, the API and the settings page.
  - E2E tests for the tenant window and the admin settings page.
