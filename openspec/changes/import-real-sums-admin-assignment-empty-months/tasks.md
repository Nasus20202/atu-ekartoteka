## 1. Money Helpers and Shared Primitives

- [x] 1.1 Create `src/lib/money/decimal.ts` exporting a `DecimalLike` type (`Prisma.Decimal | string | number`), a `toDecimal(value: DecimalLike)` normaliser, and an `isZeroAmount(value: DecimalLike)` helper. Add unit tests in `src/lib/money/__tests__/decimal.test.ts` covering all three input forms and round-tripping a value with 4 fractional digits.
- [x] 1.2 Create `src/lib/money/sum.ts` exporting `sumDecimals(values: DecimalLike[]): Prisma.Decimal`. Add unit tests in `src/lib/money/__tests__/sum.test.ts` for empty arrays, mixed input forms, and a multi-row aggregation that drifts under native float `+` but is exact under `Decimal`.
- [x] 1.3 Update `formatCurrency` in `src/lib/utils.ts` to accept `DecimalLike` and produce identical `pl-PL` PLN output as today. Add unit tests in `src/lib/__tests__/utils.test.ts` (or create one) covering all three input forms.

## 2. Schema Migration

- [x] 2.1 In `prisma/schema.prisma`, change every monetary `Float` column on `Charge` (`quantity`, `unitPrice`, `totalAmount`) and `Payment` (`openingDebt`, `openingSurplus`, `openingBalance`, `closingBalance`, and the 24 monthly `<month>Charges`/`<month>Payments` columns) to `Decimal @db.Decimal(14, 4)`. Preserve existing `@default(0)` defaults.
- [x] 2.2 Generate the Prisma migration `pnpm prisma migrate dev --name charge_payment_decimal_precision` against a local DB seeded from a real snapshot. Verify the generated SQL uses `ALTER COLUMN ... TYPE numeric(14,4) USING <col>::numeric(14,4)` for each column and that the migration runs without data loss (spot-check a few rows for value identity after migration).
- [x] 2.3 Run `pnpm prisma generate` and confirm the generated TypeScript types in `src/generated/prisma/` now type the touched fields as `Prisma.Decimal`.

## 3. Parser Updates

- [x] 3.1 In `src/lib/parsers/parser-utils.ts`, add `parseDecimalValue(raw: string): Prisma.Decimal` that converts Polish-locale `"1,2300"` strings to `new Prisma.Decimal('1.2300')`. Keep the existing `parseDecimal` for any non-money use sites; mark it deprecated if no longer needed and remove if unused.
- [x] 3.2 Update `src/lib/parsers/nal-czynsz-parser.ts` so `quantity`, `unitPrice`, and `totalAmount` are parsed via `parseDecimalValue` and the returned `NalCzynszEntry` types in `src/lib/import/types.ts` use `Prisma.Decimal`. Update `src/lib/parsers/__tests__/nal-czynsz-parser.test.ts` to assert `Prisma.Decimal` outputs and at least one sub-grosz fixture (e.g. `unitPrice = 100.0725`, `totalAmount = 142.10`).
- [x] 3.3 Update `src/lib/parsers/wplaty-parser.ts` so all 24 monthly columns and the 4 balance columns produce `Prisma.Decimal`. Update `src/lib/parsers/__tests__/wplaty-parser.test.ts` accordingly. The `openingBalance` derivation now uses `Decimal.minus`.

## 4. Importer and Validator Updates

- [x] 4.1 In `src/lib/import/validators.ts`, change `validateNalCzynsz` to return warnings (not errors) on line-total mismatch. Introduce a `warnings: ImportWarning[]` field in the import result types (`src/lib/import/types.ts`). The existing `validateChargesCrossFile` and `validateWplaty` continue producing errors. Add tests in `src/lib/import/__tests__/validators.test.ts` covering the new warning path and confirming that `validateChargesCrossFile` still aborts.
- [x] 4.2 Update `src/lib/import/importers/charges.ts` so diff comparisons use `Prisma.Decimal.equals()` rather than `===`/`!==`. The persisted `totalAmount` is the file's value (no recomputation). Add a regression test that re-importing identical data classifies all rows as `unchanged`, and re-importing with a sub-grosz drift but the same `totalAmount` also classifies as `unchanged`.
- [x] 4.3 Update `src/lib/import/importers/payments.ts` similarly: `Decimal.equals()` for diff, persistent `Decimal` writes for all 24 monthly + 4 balance columns. Update `src/lib/import/importers/__tests__/payments.test.ts`.
- [x] 4.4 Update `src/app/admin/import/page.tsx` (or its summary card subcomponent) to render the new `warnings` section ("Ostrzeżenia") under each HOA's import result, listing apartment, period, and the line-total difference. Add a test (component or E2E snippet) verifying warnings render when present.

## 5. Display Components — Decimal + Empty-Month Filter

- [x] 5.1 Create `src/lib/payments/empty-months.ts` exporting `getNonEmptyMonths(payment: Payment)` that returns a typed array `{ monthIndex: number; charges: Prisma.Decimal; payments: Prisma.Decimal }[]` skipping months where both values are zero. Add unit tests in `src/lib/payments/__tests__/empty-months.test.ts` for: all-zero year (returns []), partial year, mixed sub-grosz values, and Decimal zero-equality (`Decimal('0.0000').isZero() === true`).
- [x] 5.2 Refactor `src/components/payment-table.tsx` to iterate `getNonEmptyMonths(payment)` for the month rows, sum totals via `sumDecimals` over the full `Payment` (not the filtered list), and render values via `formatCurrency`. Confirm the file remains under 200 lines; if not, extract the row component to `payment-table-row.tsx`. Update tests in `src/components/__tests__/payment-table.test.tsx`.
- [x] 5.3 Refactor `src/components/dashboard/payments-card.tsx` to use `getNonEmptyMonths` and `formatCurrency`. Update `src/components/dashboard/__tests__/payments-card.test.tsx`.
- [x] 5.4 Refactor `src/components/payments/admin-payments-list.tsx` `sumMonths` to use `sumDecimals`; the embedded `<PaymentTable>` already inherits the empty-month filter from 5.2. Add/extend tests in `src/components/payments/__tests__/admin-payments-list.test.tsx`.
- [x] 5.5 Refactor `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx` to use `sumDecimals` for the hardcoded yearly totals (lines ~55-81) and render via `formatCurrency`. The embedded `<PaymentTable>` already inherits the filter.
- [x] 5.6 Audit and update any remaining `formatCurrency` / `.toFixed(2)` call sites that consume `Charge` or `Payment` fields (e.g. `payment-year-row.tsx`, `charges-display.tsx`, `multi-charges-display.tsx`, `dashboard/charges-summary-card.tsx`, `dashboard/payments-summary-card.tsx`, `apartment-card.tsx`, the PDF export pipeline). Each call site must accept `Prisma.Decimal` without coercion drift.

## 6. Admin User Listing — "Administratorzy" Filter

- [x] 6.1 Extend `GET /api/admin/users` in `src/app/api/admin/users/route.ts` to accept an optional `role` query parameter restricted to `ADMIN | TENANT`. When `role=ADMIN`, set `where.role = ADMIN` and ignore the `status` parameter; when omitted, preserve the current `where.role = TENANT` default. Update or add tests in `src/app/api/admin/users/__tests__/route.test.ts` to cover: default behaviour, `role=ADMIN` returns admins of all statuses, invalid `role` values rejected.
- [x] 6.2 Update `src/app/admin/users/page.tsx` to add a fifth filter button "Administratorzy" after "Odrzucone". Extend the filter state to include an `'ADMINS'` sentinel disjoint from `AccountStatus`. When active, the fetch passes `role=ADMIN` and no `status`; switching to any other filter resets `page` to 1. Reuse the existing card layout unchanged. Confirm the file remains under 200 lines; if it grows beyond that, extract the filter row to a sub-component. Add a component test verifying the button is present and clicks send the right query.
- [x] 6.3 Update the per-user assignment mutation path so apartments assigned to `role = ADMIN` users do NOT trigger an apartment-assignment / approval email. Locate the email-send call site (likely `src/lib/mutations/users/update-user-status.ts` or the assignment mutation) and skip it when `targetUser.role === ADMIN`. Add a test asserting no email is sent.

## 7. End-to-End Tests

- [x] 7.1 Add `e2e/admin/admin-users-filter.spec.ts` covering: admin logs in, navigates to `/admin/users`, clicks "Administratorzy", sees admin user(s), assigns an unassigned apartment to an admin user via the existing per-user assignment UI, and verifies the apartment appears under that admin user.
- [x] 7.2 Add `e2e/payments-empty-months.spec.ts` covering: tenant logs in, navigates to a year with mixed empty/non-empty months, asserts only non-empty month rows are visible, and asserts the yearly footer total matches the sum of source data (including zero months).
- [x] 7.3 Extend an existing import E2E test (or add `e2e/admin/import-decimal-precision.spec.ts`) to upload a fixture with sub-grosz `unitPrice`, confirm the import succeeds with a warning, and verify the displayed `totalAmount` matches the file value exactly.

## 8. Documentation and Wrap-Up

- [x] 8.1 Update `CHANGELOG.md` under "Unreleased" with three concise bullets: "Money values now stored with full Decimal precision (sub-grosz preserved)", "Admin users can be assigned apartments via /admin/users → Administratorzy filter", "Empty months are hidden in payment listings".
- [ ] 8.2 Run `pnpm lint`, `pnpm test --run`, and `pnpm exec playwright test` locally; fix any regressions before requesting review.
- [ ] 8.3 Ask the user for approval before committing the final implementation (per AGENTS.md). Squash trivial fixups; produce conventional commit messages grouped by section (e.g. one commit for schema + parsers, one for display, one for admin filter).
