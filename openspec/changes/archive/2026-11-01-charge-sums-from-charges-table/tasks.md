## 1. Legacy field rename and guard

- [x] 1.1 Rename the legacy `<month>Charges` and `closingBalance` fields in `schema.prisma` to `legacy*` with `@map` to the existing columns, add comments stating they are loaded from the input files, are incorrect, and are not presented; regenerate the client, confirm `prisma migrate diff` produces no SQL; update importers, validators, cross-year validation, E2E helpers and fixtures to the new names
- [x] 1.2 Add the ESLint `no-restricted-syntax` rule for any identifier starting with `legacy` with overrides for the allowed paths; add a lint test (or fixture file) proving the rule fires outside them and passes inside

## 2. Charge sums and derived figures

- [x] 2.1 Add `findMonthlyChargeSums` (Prisma `groupBy` by apartment and period, period range) with unit tests for grouping, range and empty input
- [x] 2.2 Add `computePaymentFigures` and `applyDerivedFigures` in `src/lib/utils/payment-balances.ts` with unit tests: settlement lines, months after `maxPeriod`, no charges, opening balance untouched, no cross-year chaining, closing equals `opening + payments − charges`

## 3. Switch reads to derived figures

- [x] 3.1 Wrap the payment queries (`find-apartment-with-payments-by-year`, `find-user-with-apartment-payments`, `find-user-with-apartments`, `find-apartment-detail`) with derived figures loaded once per call; update their tests
- [x] 3.2 Update dashboard data, balance cards and charts, payment table, PDF and admin payments list tests to assert derived values (legacy columns deliberately different in fixtures); add a test that views ignore legacy charge and closing values
- [x] 3.3 Rewrite `financial-summary/route.ts` to sum opening and payments minus `Charge` sums capped at the current period, all via Prisma aggregates; update `route` tests

## 4. Current-month cutoff

- [x] 4.1 Delete `getChargeCutoffPeriod`, `findLatestChargedPayments` and tests; pass the current period to `chargesInWindow` and the dashboard anchor; update charges, payments and dashboard pages, unit tests and `e2e/dashboard/charge-cutoff.spec.ts`

## 5. Import validation severity and rollup

- [x] 5.1 Convert `validateChargesCrossFile` to rolled-up `ImportWarning`s with the settlement marker (constant for the `Wyrównanie` prefix); stop aborting in `validateHoaFiles`; update validator and import-handler tests
- [x] 5.2 Keep `validateCrossYearBalances` on the stored legacy closing balance (rename only); add a derived drift warning check beside it that runs after charges are written; tests for both and the E2E cross-year fixture
- [x] 5.3 Extract shared `runValidators` used by import and the DB validation (no behaviour change, keep tests green)

## 6. On-demand database validation

- [x] 6.1 Implement DB-to-entry mappers and `POST /api/admin/import/validate` (admin-only, read-only, per-HOA results incl. drift) with unit tests including authorization and a no-write assertion
- [x] 6.2 Add the "Waliduj dane w bazie" button, loading and error state on the import page with component tests and an e2e flow

## 7. Admin header and footer

- [x] 7.1 Select HOA `header`/`footer` in the apartments list query, return them in the apartments API HOA DTO, render them in `HoaNoticeCard` on the admin HOA page (hidden when null); unit tests and e2e check

## 8. Verification and docs

- [x] 8.1 Add e2e seed data with settlement lines absent from legacy columns and assert tenant and admin pages show derived figures; update README
- [x] 8.2 Acceptance on a staging copy after the duplicate cleanup: 2026 shows no charge mismatches; the derived 2025 closing equals the 2026 opening for 328 of 396 apartments (the rest are PRZ18's partial year and SYM17); remaining differences appear as warnings
- [x] 8.3 Run lint, Prettier and the unit suites

## 9. Dashboard and admin notice presentation

- [x] 9.1 Make the admin HOA header and footer card collapsible and collapsed by default; unit and e2e tests
- [x] 9.2 Show the HOA footer under the dashboard notifications and make the notification details collapsible below `lg` with a CSS-only grid-rows transition; unit tests
- [x] 9.3 Let a single recent charge month use the full width in the dashboard `Naliczenia` card; unit tests
- [x] 9.4 Rename the derived payment fields with a `calculated` prefix (`calculatedJanuaryCharges` …, `calculatedClosingBalance`, `CALCULATED_CHARGE_FIELD_KEYS`) so a return to the imported values stays a small change
- [x] 9.5 Make each HOA in the database validation results collapsible with error and warning counts, and explain year-to-year errors
- [x] 9.6 Downgrade the year-to-year check on the stored closing balance to a warning (import and database validation); update tests, e2e and specs
- [x] 9.7 Run the e2e suites on a clean database and re-record the visual baselines that changed (9 mobile and admin images); sync specs on archive
