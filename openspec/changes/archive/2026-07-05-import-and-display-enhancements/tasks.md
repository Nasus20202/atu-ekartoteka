## 1. Share Precision (a)

- [x] 1.1 Update `ApartmentCard` component to render share percentage rounded to 4 decimals with trailing zeros stripped
- [x] 1.2 Update `PaymentApartmentDetailsCard` component to render share percentage with trailing zeros stripped
- [x] 1.3 Update any other share display in charges/payments pages to use shared `formatSharePercent` utility
- [x] 1.4 Write unit tests for share formatting with trailing zero removal
- [x] 1.5 Write E2E test verifying share percentage shows without trailing zeros on tenant dashboard

## 2. Import Error Export (b)

- [x] 2.1 Write a client-side utility function that serialises `HOAImportResult.errors[]` and `HOAImportResult.warnings[]` to `.txt` format string
- [x] 2.2 Add "Pobierz błędy" button to `ImportResultCard` component — triggers download of per-HOA error `.txt`
- [x] 2.3 Add "Pobierz wszystkie błędy" button at the top of the import results page — triggers combined error `.txt`
- [x] 2.4 Conditionally hide download buttons when no errors/warnings exist
- [x] 2.5 Write tests for error serialisation and conditional button rendering
- [x] 2.6 Write E2E test for import error download flow (upload bad file, verify download buttons appear and produce `.txt`)

## 3. Cross-Year Balance Validation (c)

- [x] 3.1 Add cross-year balance check inside the transaction in `import-handler.ts`, right before calling `importPayments()` — query year N payment via `tx`, compare closingBalance(N) with imported openingBalance(N+1)
- [x] 3.2 Throw error inside transaction to abort HOA import on mismatch (existing catch block propagates it)
- [x] 3.3 Ensure check is skipped when no payment record for year N exists
- [x] 3.4 Write unit tests for cross-year balance validation

## 4. Duplicate Charge Line Handling (d)

- [x] 4.1 Modify `nal-czynsz-parser.ts` to detect duplicate `apartmentCode + period + lineNo` during parsing using an in-memory Map
- [x] 4.2 When duplicate is found, assign `originalLineNo + 1000000 * dupIndex` — document edge case of collision with existing DB records
- [x] 4.3 Ensure first occurrence keeps original line number
- [x] 4.4 Write parser tests for duplicate charge line detection and synthetic line number assignment
- [x] 4.5 Log `logger.info` message when duplicate is detected (server-side log, not user-visible warning)

## 5. Future Month Hiding (f)

- [x] 5.1 In charge display components (`ChargesDisplay`, `PeriodCard`), pass `chargesDataDate` from HOA and filter out periods after that date
- [x] 5.2 In payment display components (`PaymentTable`, `PaymentsYearList`), pass `chargesDataDate` and filter out months after that date
- [x] 5.3 When `chargesDataDate` is null, show all months (no filtering)
- [x] 5.4 Write unit tests for data-date-based month filtering

## 6. E2E Test Data & Polish Terminology

- [x] 6.1 Update `e2e/test-data/import/TEST02/nal_czynsz.txt` — add duplicate charge lines (same apartment+period+line number, e.g. wyrównanie zaliczek scenario) to exercise synthetic line number assignment
- [x] 6.2 Create `e2e/test-data/import/TEST01/` — lok.txt + wplaty.txt (2027, openingBalance=-444,25) for cross-year validation against seeded TEST01 data
- [x] 6.3 Write E2E test `import-cross-year.spec.ts` — import into existing TEST01 HOA, verify cross-year balance check passes
- [x] 6.4 Change `=== HOA:` → `=== Wspólnota:` in `serialiseErrorsToTxt()` — Polish terminology in user-facing export
- [x] 6.5 Delete unused test data directories: `TEST02A/`, `TEST04/`
