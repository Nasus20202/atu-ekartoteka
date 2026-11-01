## Context

- Staging analysis (2024–2026): `Charge` lines are right once duplicates are excluded; the file's monthly charges miss settlement lines (`Wyrównanie zaliczek ZW/CW/CO` in April, June, September, December, plus other negative year-end lines in December) in closed years; the closing balance in the file is built on them. 2026 files match. File opening balances are the books' state and are trusted.
- Payment views read `Payment.<month>Charges` and `closingBalance` through `getNonEmptyMonths`, `getPaymentTotals`, `getPaymentSummary`, `toPaymentPdfDto`, dashboard data, `payment-table`, PDF and charts. The admin HOA financial summary sums `closingBalance` with `payment.aggregate`.
- `Charge` is indexed on `apartmentId` and `period` (`YYYYMM`).
- AGENTS.md: aggregation in Prisma queries, no raw SQL, files ≤ 200 lines, no magic strings.

## Goals / Non-Goals

**Goals:** correct monthly charges and balances everywhere from `Charge`; no schema change; self-healing if the exporter is fixed; actionable warnings.

**Non-Goals:** dedup cleanup and import hardening (separate change), dropping legacy columns, cross-year chaining.

## Decisions

### 1. Calculate on the go, no stored columns

New `findMonthlyChargeSums(apartmentIds, { fromPeriod, toPeriod })` in `src/lib/queries/payments/`:

```ts
prisma.charge.groupBy({
  by: ['apartmentId', 'period'],
  where: { apartmentId: { in: ids }, period: { gte, lte } },
  _sum: { totalAmount: true },
});
// -> Map<apartmentId, Map<period, Decimal>>
```

`toPeriod` is the current period (decision 3). Alternatives rejected: trigger-maintained stored columns (hidden logic, per-row cost on bulk import, no help for years without a payment row); per-view joins (duplicated logic).

### 2. Derived figures from one pure function, legacy fields renamed

**Rename (compile-time guard).** In `schema.prisma` the unreliable fields are renamed with `@map`, so database columns stay the same and no migration SQL is produced: `januaryCharges` … `decemberCharges` become `legacyJanuaryCharges` … `legacyDecemberCharges` (`@map("januaryCharges")` etc.) and `closingBalance` becomes `legacyClosingBalance` (`@map("closingBalance")`). Each carries a comment, e.g. "Loaded from wplaty.txt. The exporter omits settlement lines, so this value is incorrect and is never presented; use the figures derived from `Charge` records." After regeneration, any code that still reads the old names fails type-checking, which finds every use at once.

**Derived figures.** `src/lib/utils/payment-balances.ts`:

```ts
computePaymentFigures(payment, chargeSumsByPeriod, maxPeriod) => {
  monthlyCharges: Decimal[12];     // sums per month, 0 after maxPeriod
  monthlyBalances: Decimal[12];    // opening + cum. payments − cum. charges
  closingBalance: Decimal;         // last of the above (opening if no months)
}
```

`applyDerivedFigures(payment, sums, maxPeriod)` returns the payment without the `legacy*` fields and with `calculatedJanuaryCharges` … `calculatedDecemberCharges` and `calculatedClosingBalance` set to the derived values (type `DerivedPayment<T>`). It is applied at the query boundary, so `getNonEmptyMonths`, `getPaymentTotals`, `getPaymentSummary`, DTOs, the payment table, PDF, charts and dashboard use the `calculated*` names and see only derived data. `openingBalance`/`openingDebt`/`openingSurplus` are untouched.

**Lint guard (access control).** The compiler cannot stop a view query from selecting a `legacy*` field deliberately, so ESLint `no-restricted-syntax` (selector on any identifier starting with `legacy`, so the prefix itself is the convention for "do not use outside import code") reports an error everywhere except `src/lib/import/**`, the on-demand validation module, `src/lib/queries/payments/**` (where derivation happens), tests and the generated client. It runs in lint-staged and CI like the other lint rules.

Apply derivation in: `find-apartment-with-payments-by-year`, `find-user-with-apartment-payments`, `find-user-with-apartments` (dashboard), `find-apartment-detail` (admin), by wrapping each result in a small `*WithDerivedFigures` helper in the same folder that loads sums once per call for all returned apartments and years.

No chaining: each year uses its own imported opening balance. Reasons: opening balances are the books' state at 1 January and match recalculated closings for 328 of 396 apartments; chaining would spread errors and make the current balance wrong for the remaining apartments.

### 3. Cutoff and balance cap = current month

Tenant lists, dashboard anchor and every balance use `dateToPeriod(now)` as `maxPeriod`; admin lists still show later months but totals and balances are capped (planned future charges must not lower today's balance). Delete `getChargeCutoffPeriod`, `findLatestChargedPayments` and their tests; callers of `chargesInWindow(startYear, cutoffPeriod)` pass the current period. Rejected: `.wmb` date (per HOA, stale), "all payments zero" (an unpaid month is not an unissued month; extra query).

### 4. Admin HOA financial summary

`financial-summary/route.ts` currently sums `closingBalance`. New total = Σ opening + Σ payments (twelve `_sum` columns in one `payment.aggregate` per distinct latest year, as today) − `charge.aggregate({ _sum: totalAmount })` with one `OR` clause per `(year, apartmentIds)` and `period` between `<year>01` and `min(<year>12, current period)`. All in Prisma queries.

### 5. Validation: severity and rollup

- `validateChargesCrossFile` returns `ImportWarning[]` (one per owner, apartment and year, `message` listing differing periods with both values; a `difference` total; marks months whose difference equals the sum of `Wyrównanie` lines, prefix in a constant `SETTLEMENT_DESCRIPTION_PREFIX`). `validateHoaFiles` appends them and no longer returns false for it. Unit tests cover the rollup, the settlement marker and the retained owner-change scenarios.
- `validateWplaty` (identity on file values) is unchanged and still aborts.
- `validateCrossYearBalances` still compares against the stored legacy closing balance but now reports a warning instead of aborting (closed-year closing balances in the files omit settlement lines). A new check beside it compares year N+1's imported opening balance with the derived closing balance of year N (via `computePaymentFigures`, `maxPeriod` = December of N), skips partial years like the existing check, and pushes warnings to `result.warnings`. It must run after charges are written in the import transaction so the sums exist.
- Imported legacy values keep being written by `buildPaymentData` under the `legacy*` fields and compared by `hasPaymentChanged`.

### 6. On-demand database validation

`POST /api/admin/import/validate` (admin-only, same pattern as `/api/admin/import`) iterates HOAs sequentially. Per HOA it loads charges and payments with Prisma, maps them to `NalCzynszEntry`/`PaymentEntry` shapes and runs the same validators through a shared `runValidators(...)` extracted from `validateHoaFiles`, plus the drift check from decision 5 using stored data. Response `{ results: HOAImportResult[] }` (stats zero), so `ImportResults` and downloads are reused. Read-only, no transaction. Import page: "Waliduj dane w bazie" button, loading state, `Alert` on failure.

### 7. Admin header and footer on the HOA page

The header and footer belong to the HOA, so they are shown on the admin HOA apartments page. `findApartmentsPaginated` selects `header` and `footer` with the HOA it already loads, the apartments list API returns the HOA through `toHomeownersAssociationNoticeDto`, and a `HoaNoticeCard` above the search renders them with the existing `HoaNotice` text style (`whitespace-pre-line`), hidden when both are null.

## Risks / Trade-offs

- Extra `groupBy` per payment view: one indexed query per page load; admin HOA total adds one per year. Measure on KA75 sized HOAs; if needed add a stored aggregate later.
- Renaming touches many fixtures and tests that use the old field names (database columns do not change); the compiler lists every site. The lint rule keeps the renamed fields confined to import code.
- Until the 2026-07-05 duplicate batch is removed from staging, 16 apartments show doubled 2025 charges and balances.
- Drift warnings will list apartments whose cause is unknown (68 of 396 on staging); they are information, not blocking.
- Past-year balances change visibly for tenants (settlements now counted); expected and the reason for the change.

## Open Questions

1. Cross-file charge check downgraded from error to warning (assumed yes).
2. The year-to-year check on the imported closing balance is downgraded to a warning, like the derived drift check (decided).
3. Admin views: show future months in lists but cap totals (assumed); confirm.
