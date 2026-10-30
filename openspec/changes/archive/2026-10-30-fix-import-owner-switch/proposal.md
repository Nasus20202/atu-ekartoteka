# Proposal

## Why

Importing the SYM17 export from 2026-10-30 is blocked by two validation checks, even though the data is valid.

1. **Cross-file charge check: owner ignored.** After an owner change, `wplaty.txt` has one row per owner for the same apartment and year.
   - The former owner's row has no monthly charges; it only carries the balance transfer. `nal_czynsz.txt` lists charges only under the current owner.
   - The check sums `nal_czynsz` per apartment and period without looking at the owner, then compares that sum with every `wplaty` row for the apartment. The former owner's zero charges are measured against the current owner's charges, and the whole HOA import is aborted.
   - Seen in: apartments `00009M` (owners `W00097` → `W00513`) and `00014M` (owners `W00014` → `W00534`), 20 errors for periods 202601–202610.
2. **Cross-year balance check: compares against a partial year.** The check requires the opening balance of year N+1 to equal the stored closing balance of year N.
   - The 2025 rows in the database come from an export taken mid-year (2025-11-24). They end on 28.02, 30.09, 31.10 or 30.11.2025, so their closing balance is not the year-end balance.
   - All 22 SYM17 units mismatch, and the check stops at the first one (`00001M`: opening −624.21 ≠ closing −1326.37). Mid-year exports are normal for this source system, so a stored previous year cannot be assumed complete.

## What Changes

- **Cross-file charge check** (`validateChargesCrossFile`): match `nal_czynsz` entries to `wplaty` rows by owner, apartment and period (`externalOwnerId#externalApartmentId|YYYYMM`) instead of by apartment and period only. This is the same owner+apartment key used everywhere else in the import (apartment map, payment and charge importers).
  - **BREAKING** (project is at v0): a `wplaty` row is now checked only against charges of the same owner. Charges filed under a different owner of the same apartment no longer count toward that row.
- **Cross-year balance check** (`validateCrossYearBalances`):
  - Compare only when the stored previous-year record runs to 31 December. A stored partial year is skipped, as a missing year already is.
  - Check every apartment and report all mismatches before aborting, instead of stopping at the first.
  - A mismatch against a complete previous year still aborts the import.
- **Skipped-record warnings**: when charge, notification or payment rows are skipped because no imported apartment matches their owner+apartment, add one warning per owner+apartment with the counts and the reason. The two reasons are "the ID is not an owner ID" (e.g. the Orange lease `N00001…STELES` in SYM17) and "the owner is in neither `lok.txt` nor the database" (e.g. a former owner on a first import). Today these rows only show up as an unexplained "Pominiętych" count.
  - The warning type no longer requires period, line and difference, so it can carry warnings that are not line-total checks.

## Non-goals

- Changing how the former owner's `wplaty` row is stored. As today, it is attached to the former owner's apartment when that apartment already exists in the database (it is deactivated, since the owner is no longer in `lok.txt`), and skipped otherwise.
- Changing the per-row WPLATY closing-balance check.
- Checking `nal_czynsz` entries that have no matching `wplaty` row (not checked today either).
- Turning cross-year mismatches into warnings, or repairing stored partial-year rows. A later full-year export updates them through the normal payment import.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-import`:
  - "Naliczenia Import Validation": the cross-file charge sum is compared per owner+apartment+period, with scenarios for owner changes.
  - "Payment Import Validation": the cross-year check applies only against a complete stored previous year and reports every mismatching apartment.
  - New "Skipped Record Warnings" requirement; the "Import result UI surfaces warnings" scenario covers warnings without period, line or difference.

## Impact

- `src/lib/import/validators.ts` (`validateChargesCrossFile`), `src/lib/import/cross-year-validation.ts` (`validateCrossYearBalances`)
- `src/lib/import/skipped-records.ts` (new), `src/lib/import/import-hoa-transaction.ts`, `src/lib/import/types.ts` (`ImportWarning`), `src/lib/parsers/owner-id.ts` (new, shared owner-ID check), `src/lib/parsers/apartment-parser.ts`, `src/app/admin/import/import-warnings.tsx`
- Unit tests for both checks and for skipped-record warnings; new E2E fixture and spec for an owner-change import; E2E case for a partial previous year
- No database, API or UI changes
