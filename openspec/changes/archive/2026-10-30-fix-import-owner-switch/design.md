# Design

## Context

See proposal.md (Why). Before the import transaction starts, `validateHoaFiles` (`src/lib/import/validate-hoa-files.ts`) runs three checks on the parsed files. The cross-file charge check, `validateChargesCrossFile` in `src/lib/import/validators.ts`:

1. builds a map of `nal_czynsz` totals keyed `apartmentExternalId|YYYYMM`;
2. walks every `wplaty` row and month, and looks up `apartmentCode|YYYYMM`.

The owner is available on both sides but not used:

- `NalCzynszEntry.id`: the owner's external ID (column 0, e.g. `W00513`)
- `PaymentEntry.externalId`: the same owner ID in `wplaty.txt`

The rest of the import already keys rows by `${ownerId}#${apartmentId}`:

- `importApartments` (the apartment map)
- `importCharges` (`${entry.id}#${entry.apartmentExternalId}`)
- `importPayments` and `validateCrossYearBalances` (`${entry.externalId}#${entry.apartmentCode}`)

The existing unit fixtures for `validateChargesCrossFile` use different owner IDs on the two sides (`NAL001` for charges, `W001` for payments). They only pass today because the owner is ignored.

## Goals / Non-Goals

**Goals:**

- Make the cross-file check use the same owner+apartment identity as the rest of the import.
- Put the owner in the error message so an admin can tell which `wplaty` row failed.

**Non-Goals:**

- Restructuring `validateHoaFiles`, or the order and abort behaviour of the checks.
- Persisting former-owner `wplaty` rows, or any change to the apartment map.

## Decisions

### Key both sides by `ownerId#apartmentId|period`

- **Charges side:** sum by `${entry.id}#${entry.apartmentExternalId}|${entry.period}`.
- **Payments side:** look up `${payment.externalId}#${payment.apartmentCode}|${period}`.

The `#` separator matches the importers, so the identity has one meaning across the import. A small local key builder in `validators.ts` keeps both sides from drifting apart.

The current "skip months where both sides are zero" rule stays. This is the rule that lets former-owner rows pass: zero charges in `wplaty` and no `nal_czynsz` entries for that owner.

**Alternatives considered:**

- _Skip `wplaty` rows whose owner is not in `lok.txt`._ This would fix SYM17, but only by never validating former-owner rows. It also needs the apartment list inside the validator. It would still break when both owners have charges in the same year (mid-year owner change).
- _Aggregate `wplaty` charges per apartment across owners and compare with the apartment-level `nal_czynsz` sum._ This keeps the old granularity and handles both cases. However, it hides a misattributed charge (filed under the wrong owner) and disagrees with how charges and payments are stored, which is per owner+apartment. Rejected in favour of strict matching; breaking changes are acceptable at v0.

### Include the owner in the error message

New message:

`Lokal {apartmentCode} (właściciel {ownerId}), okres {period}: suma naliczeń … ≠ naliczenia z wpłat … (różnica …)`

This matters because an apartment can now have several `wplaty` rows that are checked separately. The message is plain text in `result.errors`; nothing parses it. The existing E2E tests assert only on cross-year and closing-balance messages, so they are not affected.

### Tests

- **Unit:** move the `validateChargesCrossFile` suite out of `validators.test.ts` (365 lines, over the 200-line limit) into a new `src/lib/import/__tests__/validators-cross-file.test.ts`.
  - Fix the fixture builders so both sides take an explicit owner ID.
  - Add one case per spec scenario: former owner with zero charges, mid-year change with charges under both owners, charges under another owner don't count.
- **E2E:** add fixture folder `e2e/test-data/import/TEST05/`, a minimal copy of the SYM17 shape:
  - `lok.txt` with the current owner only;
  - `nal_czynsz.txt` under the current owner;
  - `wplaty.txt` with a former-owner balance-transfer row plus the current owner's row.
- Add `e2e/admin/import-owner-change.spec.ts`. It follows `import-cross-year.spec.ts` (upload the folder, click `Importuj`) and asserts the HOA imports without validation errors. TEST05 is used only by this test, so it does not collide with shared TEST01 data.

### Cross-year check: compare only against a complete previous year

`validateCrossYearBalances` (`src/lib/import/cross-year-validation.ts`) runs inside the import transaction, before `importPayments`. Today it:

- looks up the stored previous-year `Payment` (`closingBalance` only);
- throws on the first mismatch, so `import-handler.ts` rolls back and adds a `Błąd transakcji: …` line.

Changes:

- **Select `dateTo` as well, and skip the apartment when the stored year is partial.** This handles a partial year the same way as a missing one; neither gives a year-end balance to compare against.
- **How "complete" is decided.** `parseDate` builds local-midnight dates, and `Payment.dateTo` is a `timestamp without time zone`, so the stored instant depends on the server's timezone at import time (e.g. 2025-09-30 is stored as `2025-09-29 22:00`). The previous year counts as complete when `dateTo >= 31 December − 1 day` (local). That allows up to a day of timezone shift. It can never confuse the year end with a partial year: exports end on a month end, and the latest partial end is 30 November. The month index, day and one-day duration are named constants.
- **Collect every mismatch, then throw once.** Push one message per apartment into `errors` (same text as today), then throw a single summary error after the loop so the transaction still rolls back. Summary: `Niezgodność sald otwarcia z zamknięciem poprzedniego roku: {n} lokal(e)`.

**Alternatives considered:**

- _Warn instead of abort._ This would hide a real break between two closed years, which is exactly what the check exists to catch. Rejected.
- _Compare against the stored row's balance at its end date, recomputed forward._ Not possible: the months after the stored end date are missing.
- _Move the cross-year check before the transaction (with the other validators)._ It needs the apartment map and DB reads, both of which only exist inside the transaction. Out of scope.

### Tests (cross-year)

- **Unit:** new `src/lib/import/__tests__/cross-year-validation.test.ts`, with the existing case moved out of `import-handler.test.ts` (754 lines). Cases:
  - complete year with a mismatch aborts;
  - complete year with a match passes;
  - partial year with a mismatch is skipped;
  - missing year is skipped;
  - several mismatches give one error each, then a single throw;
  - a `dateTo` stored with a timezone shift still counts as complete.
- **E2E:** add an optional `dateTo` to `createCrossYearImportFixture` (default `2026-12-31`, also applied on conflict). In `import-cross-year.spec.ts`, add a case that seeds TEST04 with a partial 2026 (`2026-09-30`) and imports the same mismatching 2027 file, then expects success. Mark the file serial, since both cases reuse TEST04.

### Skipped-record warnings

- **Where:** a new pure module `src/lib/import/skipped-records.ts` with `buildSkippedRecordWarnings(apartmentMap, { charges, notifications, payments })`. `importHoaInTransaction` calls it after the importers and appends the result to `result.warnings`.
  - It uses the same lookup as the importers (`apartmentMap.get(ownerId#apartmentId)`), so the warnings match the "Pominiętych" counts without touching the importers.
  - It groups rows by owner+apartment and keeps the first-seen order, so the output is stable.
- **Reason:** the `W` prefix check moves from `apartment-parser.ts` into `isOwnerId` in a new `src/lib/parsers/owner-id.ts` (with an `OWNER_ID_PREFIX` constant; a separate module so tests that mock the apartment parser keep working). The parser and the warning builder share it, so "not an owner ID" means the same thing in both places.
- **Message** (Polish, counts via `formatCountPl`):
  - `Pominięto 10 naliczeń, 1 wpłatę dla N00001: identyfikator nie oznacza właściciela (W), lokal nie jest importowany`
  - `Pominięto 1 wpłatę dla W00097: brak właściciela w lok.txt i w bazie`
- **Type:** `ImportWarning.period`, `lineNo` and `difference` become optional. `ImportWarnings` renders only the parts present: `Lokal X[, okres P][, linia N][, różnica D]: message`. Line-total warnings render exactly as before, and the error export already treats `period` as optional.

**Alternatives considered:**

- _One warning per skipped row._ SYM17 would produce 11 lines saying the same thing. Rejected in favour of grouping.
- _Collect inside each importer._ That would duplicate the grouping three times and spread the warning text across files. Rejected.

### Tests (skipped-record warnings)

- **Unit:**
  - `src/lib/import/__tests__/skipped-records.test.ts`: non-owner grouping with counts, unknown owner, nothing skipped, Polish plural forms;
  - `src/app/admin/import/__tests__/import-warnings.test.tsx`: a line-total warning renders as before, and a warning without period/line/difference renders only the apartment and message.
- **E2E:**
  - add an `N20003` lease row to TEST05 (`lok.txt`, `nal_czynsz.txt`, `wplaty.txt`);
  - `import-owner-change.spec.ts` asserts two warnings: the former owner `W20001` (unknown owner) and `N20003` (not an owner ID).

## Risks / Trade-offs

- [A previous year imported from a mid-year export is never cross-checked, even when a later full-year export would have exposed a real break.] → Importing the full-year export updates the stored row (`importPayments` updates changed year rows), and the check then applies to the next year.
- [Server timezone changes between imports could shift `dateTo` by up to a day.] → Covered by the one-day tolerance.

- [Real exports where `nal_czynsz` files a charge under a different owner ID than `wplaty` for the same row would now fail.] → This is the intended strict behaviour (spec scenario "Charges of another owner do not count"). Before merging, re-run the import on the available real data sets (SYM17 and the others in `Ekartoteka dane`) to confirm no regressions.
- [A `nal_czynsz` owner with no `wplaty` row is still not validated.] → Same as today, and out of scope per the proposal.

## Migration Plan

No DB schema, API or data migration. Deploy as a normal release; roll back by reverting the commit.
