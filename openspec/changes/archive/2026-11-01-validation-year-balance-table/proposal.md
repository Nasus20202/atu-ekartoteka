## Why

On-demand database validation reports year-to-year balance problems only as a flat list of per-apartment warnings. An admin cannot see, per HOA and year, whether the balances carried from one year to the next add up. Validation also loads HOAs one after another, while the import already processes HOAs with bounded concurrency.

## What Changes

- Database validation processes HOAs with the same bounded concurrency as the import (`IMPORT_HOA_CONCURRENCY`) instead of one after another.
- Database validation shows a balance table above the warnings: one row per HOA and year, with the opening balance loaded from the files and the calculated closing balance.
- A closing balance that does not match the opening balance of the following year is shown in red. The per-apartment drift warnings stay as they are.
- The year-to-year drift check is already implemented (`Derived Balance Drift Warning`); this change keeps it running in on-demand validation and covers it with tests. No new warning type is added.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `data-import`: the `On-Demand Database Validation` requirement changes (bounded concurrency, balance table shown above the findings). A new `Year Balance Overview Table` requirement is added.

## Impact

- `src/lib/import/validate-database.ts`: bounded HOA concurrency; collects per-HOA balance rows.
- New pure module in `src/lib/import/` that sums opening and calculated closing balances per HOA and year and marks mismatches.
- `src/lib/import/types.ts`: optional balance rows on `HOAImportResult`. The `/api/admin/import/validate` response gains this field; the import response is unaffected because the field is optional.
- `src/app/admin/import/validation-results.tsx` and a new table component: rendering above the findings, shown even when there are no findings.
- Unit tests next to the new module and the validation pipeline; one E2E assertion in `e2e/admin/validate-database.spec.ts`.
- No database schema change, no migration, no change to import behaviour.

## Non-goals

- Changing the import, or the warnings that the import raises.
- Fixing the existing warnings the local database produces.
- A per-apartment table. The table is per HOA and year; per-apartment detail stays in the warnings.
- Comparing closing balances across more than one year apart.
