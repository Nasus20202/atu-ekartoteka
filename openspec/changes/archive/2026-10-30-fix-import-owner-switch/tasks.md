# Tasks

## 1. Owner-aware cross-file charge check

- [x] 1.1 Move the `validateChargesCrossFile` suite from `src/lib/import/__tests__/validators.test.ts` into a new `src/lib/import/__tests__/validators-cross-file.test.ts`.
  - Change its `makeNal`/`makePayment` builders to take an explicit owner ID, and use the same owner on both sides in the existing cases.
  - Verify: `pnpm vitest --run src/lib/import/__tests__` passes, and `validators.test.ts` no longer contains the suite.
- [x] 1.2 In `src/lib/import/validators.ts`, key `validateChargesCrossFile` by `ownerId#apartmentId|period` on both sides, using a shared local key builder.
  - Charges side: `NalCzynszEntry.id` + `apartmentExternalId`. Payments side: `PaymentEntry.externalId` + `apartmentCode`.
  - Keep the "both sides zero" skip.
  - Change the error message to `Lokal {apartmentCode} (właściciel {ownerId}), okres …`.
  - Verify: the moved suite passes, with assertions updated to the new message.
- [x] 1.3 Add unit cases to `validators-cross-file.test.ts` for the new spec scenarios:
  - a former-owner row with zero charges plus the current owner's matching charges gives no errors;
  - a mid-year change with each owner's charges matching gives no errors;
  - charges filed only under another owner give an error that names the `wplaty` row's owner.
  - Verify: `pnpm vitest --run src/lib/import/__tests__/validators-cross-file.test.ts` passes.

## 2. Cross-year check against complete previous year only

- [x] 2.1 Move the cross-year unit case from `src/lib/import/__tests__/import-handler.test.ts` into a new `src/lib/import/__tests__/cross-year-validation.test.ts`.
  - Verify: `pnpm vitest --run src/lib/import/__tests__` passes, and `import-handler.test.ts` no longer references `validateCrossYearBalances`.
- [x] 2.2 In `src/lib/import/cross-year-validation.ts`:
  - select `dateTo` and skip the apartment when the stored previous year ends before 31 December (with a one-day timezone tolerance, using named constants);
  - collect every mismatch into `errors`, then throw one summary error after the loop.
  - Add unit cases: complete mismatch aborts, complete match passes, partial year skipped, missing year skipped, several mismatches reported then a single throw, timezone-shifted year end counts as complete.
  - Verify: `pnpm vitest --run src/lib/import/__tests__/cross-year-validation.test.ts` passes.
- [x] 2.3 Add an optional `dateTo` to `e2e/utils/create-cross-year-import-fixture.ts` (default `2026-12-31`, also set on conflict). In `e2e/admin/import-cross-year.spec.ts`, mark the file serial and add a case that seeds a partial 2026 (`2026-09-30`), imports the mismatching 2027 file and expects `Import zakończony pomyślnie`.
  - Verify: `pnpm playwright test e2e/admin/import-cross-year.spec.ts --project=chromium-admin` passes both cases.

## 3. E2E owner-change import

- [x] 3.1 Add fixture folder `e2e/test-data/import/TEST05/` modelled on the SYM17 shape:
  - `lok.txt` with the current owner only;
  - `nal_czynsz.txt` under the current owner for a few periods;
  - `wplaty.txt` with a former-owner balance-transfer row (zero charges) plus the current owner's row, both balancing.
  - Verify by checking the files against the per-row WPLATY balance rule (opening + payments − charges = closing).
- [x] 3.2 Add `e2e/admin/import-owner-change.spec.ts`, following `import-cross-year.spec.ts`: upload TEST05, click `Importuj`, assert there is no `Wspólnoty z błędami` section and that the result reports a successful import.
  - Verify: `pnpm playwright test e2e/admin/import-owner-change.spec.ts` passes.

## 4. Skipped-record warnings

- [x] 4.1 Add `isOwnerId` (with an `OWNER_ID_PREFIX` constant) in `src/lib/parsers/owner-id.ts` and use it in `src/lib/parsers/apartment-parser.ts`. Make `ImportWarning.period`, `lineNo` and `difference` optional, and make `src/app/admin/import/import-warnings.tsx` render only the parts present.
  - Add `src/app/admin/import/__tests__/import-warnings.test.tsx` covering both warning shapes.
  - Verify: `pnpm vitest --run src/app/admin/import src/lib/parsers` passes.
- [x] 4.2 Add `src/lib/import/skipped-records.ts` (`buildSkippedRecordWarnings`) and call it from `importHoaInTransaction` after the importers.
  - Add `src/lib/import/__tests__/skipped-records.test.ts`: non-owner grouping with counts, unknown owner, nothing skipped, plural forms.
  - Verify: `pnpm vitest --run src/lib/import` passes.
- [x] 4.3 Add an `N20003` lease row to TEST05 (`lok.txt`, `nal_czynsz.txt`, `wplaty.txt`, balancing), and assert both skipped-record warnings in `e2e/admin/import-owner-change.spec.ts`.
  - Verify: `pnpm playwright test e2e/admin/import-owner-change.spec.ts e2e/admin/import-decimal-precision.spec.ts --project=chromium-admin` passes.

## 5. Integration checks

- [x] 5.1 Run `pnpm lint`, `pnpm format:check` (or Prettier on the changed files) and the full `pnpm vitest --run`. Verify all pass.
- [x] 5.2 Re-import the real SYM17 data (`Ekartoteka dane/SYM17 zmiana właściciela/SYM17`) and the other available real data sets on a local instance.
  - Verify: SYM17 imports with 0 errors (cross-file and cross-year) and shows a skipped-record warning for `N00001`, and no previously passing data set now reports cross-file errors.

## Workflow follow-up

- Ask for approval, then commit (`fix(import): match cross-file charges by owner and apartment`).
- Archive the change with `/opsx:archive` after review, which syncs the `data-import` delta into the main spec.
