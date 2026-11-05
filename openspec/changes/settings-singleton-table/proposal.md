# Proposal

## Why

`AppSetting` is a free-form `key` / `Json value` table. The only validation lives in application code (`src/lib/settings/registry.ts`), so the database accepts any key, any JSON, and any number of rows, and an invalid stored value silently falls back to a default. There is one setting today, which makes this the cheapest moment to replace it with a typed, constrained table. Settings are also read from the database once per caller, and a tenant page load asks for them several times.

## What Changes

- Replace the `AppSetting` key/value table with a singleton `AppSettings` table: one row (`id` fixed to `1`, enforced by a `CHECK`) with one typed column per setting.
- Enforce value rules in the database (`NOT NULL`, `DEFAULT`, `CHECK` range) as well as in the Server Action, so no writer can store an out-of-range value.
- Write the migration so it works on an empty database and on a database that already has the `tenantHistoryYearsBack` row (including a missing, malformed or out-of-range stored value, which falls back to the default).
- Load the settings at most once per request (React `cache`) so a page that asks several times issues one query.
- Update to a single-row read and a single-row upsert; remove the per-key upsert loop and the merge-over-defaults step.
- **BREAKING** (schema only): the `AppSetting` table is dropped. No API or UI change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tenant-history-window`: the `Admin-Configurable Window Length` requirement gains the storage guarantees (single settings row, database-enforced range) and the once-per-request load; existing behaviour is unchanged.

## Impact

- `prisma/schema.prisma` and a new migration (create `AppSettings`, copy data, drop `AppSetting`).
- `src/lib/queries/settings/get-app-settings.ts`, `src/lib/mutations/settings/update-app-settings.ts`, `src/lib/settings/registry.ts` and their tests.
- Consumers (`getTenantHistoryStartYear`, `settings-section`, `updateSettingsAction`) keep their signatures.
- `openspec/specs/tenant-history-window/spec.md`.

## Non-goals

- Adding new settings or changing the 0 to 20 range and default of 2.
- Caching settings across requests or invalidating a shared cache.
- Changing the settings page UI or the Server Action contract.
