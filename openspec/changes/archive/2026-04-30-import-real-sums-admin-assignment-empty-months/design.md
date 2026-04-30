## Context

The current state of the three pain points:

1. **Money handling.** All money columns on `Charge` and `Payment` are Prisma `Float` (IEEE-754 double). The parser converts Polish-locale `"123,45"` strings via `parseFloat` (`src/lib/parsers/parser-utils.ts:14-16`). The importer derives `expected = quantity × unitPrice` and the validator (`src/lib/import/validators.ts:9-24`) rejects the import when the file's `totalAmount` differs from `expected` by more than `NAL_AMOUNT_TOLERANCE = 0.01` (`src/lib/import/constants.ts`). For sub-grosz unit prices (e.g. `unitPrice = 100.0725`, `quantity = 1.42`, `totalAmount = 142.10`) the recomputed value can drift by more than the tolerance, causing the import to fail or — if it passes — storing a value that does not match the source-of-truth ledger. Display is via `formatCurrency` and `.toFixed(2)` (`src/lib/utils.ts:32-37`); aggregations use `Array.reduce((a, b) => a + b, 0)`.

2. **Admin user filtering & assignment.** `/admin/users` (`src/app/admin/users/page.tsx`) shows a status filter row with `Wszyscy / Oczekujące / Zatwierdzone / Odrzucone` (lines 397-443). The underlying `GET /api/admin/users` (`src/app/api/admin/users/route.ts`) hardcodes `where.role = TENANT` so admin users never appear in this list. Each user card already supports an "assign apartments" interaction (the data shape is in place: `user.apartments` is loaded and editable). Adding admins to the same listing — opt-in via a filter button — is therefore a small surface change with reuse of the existing assignment UI.

3. **Empty-month rows.** Four components iterate the 12 months of `Payment` columns regardless of whether either side is non-zero:
   - `src/components/payment-table.tsx:132-189` (the canonical 12-row grid).
   - `src/components/dashboard/payments-card.tsx:64-71` (dashboard summary).
   - `src/components/payments/admin-payments-list.tsx:139-143` (admin view, embeds `PaymentTable`).
   - `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx:178` (yearly detail page, also embeds `PaymentTable`).

   Yearly aggregates ("Razem") in the same components are computed by summing all 12 monthly columns directly from the `Payment` row (e.g. `payment-table.tsx:191-211` and `dashboard/payments-card.tsx:73-77`). Filtering must happen at the row-iteration step only, with totals continuing to sum the full data set.

## Goals / Non-Goals

**Goals:**

- Persist the file-provided `totalAmount` verbatim and use it as the source of truth for display, aggregation, and PDF export.
- End-to-end Decimal precision (4 fractional digits) across schema, parsers, importers, queries, business logic, and tests. Display continues to format to 2 decimals via `formatCurrency`.
- Add a single new filter button "Administratorzy" on `/admin/users` that loads users with `role = ADMIN`. The existing per-user apartment assignment UI is reused as-is — no changes to its visual or behavioural contract.
- Hide month rows where both `<month>Charges` and `<month>Payments` are zero in all four monthly listings, while preserving accurate yearly totals.

**Non-Goals:**

- Backfilling already-imported data. The migration converts existing `Float` values to `Decimal` losslessly but does not retroactively re-import from source files. Any pre-existing rounding error stays until the next re-import.
- Restructuring or rewriting `payment-table.tsx` beyond the empty-month filter (e.g. separating into sub-components). The file is currently ~216 lines — close to the 200-line ceiling — but a refactor is out of scope here.
- Adding admins to the `/admin/users/management` bulk assignment UI. That page stays tenant-only.
- Adding a "rejected apartments" grouper or changing the rejection-clears-apartments behaviour.
- Per-apartment "assign to admin" action on the apartment detail page.
- Touching `ChargeNotification` precision — it is already correct (`Float` storing parsed decimals; no recomputation).

## Decisions

### Decision 1 — Use `Prisma.Decimal` end-to-end, store with `@db.Decimal(14, 4)`

**Rationale.** PLN amounts realistic for HOA charges (a few hundred thousand zł max) easily fit in `Decimal(14, 4)` — 10 integer digits + 4 fractional digits. Source files round to 4 decimals at most (Polish locale, observed in `unitPrice` like `1,2300`). 4 fractional digits give a 10× safety margin over grosz (2 decimals) without bloating storage. Prisma maps `@db.Decimal(p, s)` to PostgreSQL `numeric(p, s)`, returning `Prisma.Decimal` (decimal.js-light) instances on the JS side — no extra dependency.

**Alternative considered.** Keeping `Float` and just storing `totalAmount` as-is. Rejected because: (a) `Float` already loses precision the moment we read `parseFloat("142.0725")` — the IEEE-754 double `142.0725` is actually `142.07250000000000227...`, which compounds across hundreds of monthly aggregates; (b) `===` comparisons in importer diffs (`importers/charges.ts:40-154`) become unreliable; (c) future reporting and PDF exports will keep accumulating drift. The user explicitly chose Decimal.

**Alternative considered.** Storing both `totalAmount` (calculated) and `realTotalAmount` (file). Rejected: dual columns require every consumer to know which to use, and the calculated column is now redundant since we removed it as the validation gate. Single source of truth is simpler.

### Decision 2 — Validator becomes a non-blocking warning

The `quantity × unitPrice ≈ totalAmount` check (`validators.ts:9-24`) currently aborts the HOA import. Change behaviour: keep the check, but on mismatch produce a `warning` entry in the per-HOA result instead of an `error`. The user-visible import result UI gains a "warnings" section (informational only). The cross-file (`validateChargesCrossFile`) and balance (`validateWplaty`) checks remain hard errors — they catch ledger-level inconsistencies that are not fixed by trusting the file's totalAmount.

**Rationale.** The whole point of the change is that file-`totalAmount` is the truth. Aborting on its disagreement with the recomputation defeats that. Surfacing it as a warning still gives admins visibility into source-data quirks without blocking imports.

### Decision 3 — Decimal serialisation across the API boundary

Prisma serialises `Decimal` as JSON strings by default (e.g. `"142.0725"`), not numbers, to avoid JS precision loss during transport. We adopt that contract: API responses for charges and payments return decimal strings; client-side display helpers parse them back with `new Prisma.Decimal(value)` or accept both (`number | string | Prisma.Decimal`). Add a thin shared helper `toDecimal(value)` in `src/lib/money/decimal.ts` that normalises any of the three inputs into `Prisma.Decimal`, plus `formatCurrency(value)` accepting the same union.

**Rationale.** Mirrors Prisma's own conventions; avoids reinventing arithmetic; lets us keep `pl-PL` `Intl.NumberFormat` for display by going `decimal.toFixed(2)` → `Number(...)` → `Intl.NumberFormat` only at the leaf formatting step. Unit tests cover round-tripping to confirm no precision loss above 4 decimals.

### Decision 4 — `Decimal` arithmetic for monthly aggregates

All `array.reduce((a, b) => a + b, 0)` patterns over money values are replaced with helpers:

```ts
// src/lib/money/sum.ts
export function sumDecimals(values: DecimalLike[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>(
    (acc, v) => acc.plus(toDecimal(v)),
    new Prisma.Decimal(0)
  );
}
```

Used in: `payment-table.tsx`, `dashboard/payments-card.tsx`, `admin-payments-list.tsx`, the user yearly page, and the admin per-apartment view. Footer/total formatting goes through the same `formatCurrency`.

### Decision 5 — Admin filter wiring

- **API.** Extend `GET /api/admin/users` with optional `role` query parameter (`ADMIN | TENANT`). When omitted, default behaviour is **unchanged** (returns `TENANT` only) to preserve the existing contract for all current callers. The page sends `?role=ADMIN` only when the new "Administratorzy" filter is active.
- **UI.** Add a fifth button "Administratorzy" after "Odrzucone" in the filter row (`page.tsx:397-443`). Reuse the existing `filter` state machine by extending it with a new sentinel value `ADMINS` (separate from `AccountStatus`). When `filter === 'ADMINS'`, the request includes `role=ADMIN` and **no** `status` filter (admins are always considered "active"); when `filter` is one of the existing values, behaviour is unchanged.
- **Card layout.** No template changes. The existing card already renders `getStatusBadge` and the assignment block based on `user.apartments`; admins flow through identically.

**Alternative considered.** Adding `role` to the existing status filter enum so the buttons all live in one switch. Rejected because mixing `role` and `status` in one variable confuses the filter contract and the API call site.

### Decision 6 — Empty-month filter location

A pure helper `getNonEmptyMonths(payment)` in `src/lib/payments/empty-months.ts` returns the subset of month entries where `charges` or `payments` is non-zero (using `Decimal.isZero()`). The four components import this helper and iterate its result instead of the hardcoded 12-row arrays. Yearly totals continue to sum directly from the `Payment` row — they do not depend on the filtered list.

**Rationale.** Single shared helper avoids drift across the four sites; `Decimal.isZero()` is the safe equality check for `Decimal` values (avoids `=== 0` traps).

**Edge case.** When all 12 months are zero (e.g. apartment with no charges in a given year), the listing renders no month rows but still shows the year row, opening balance, closing balance, and the "Razem" footer (zeros). The "Bilans otwarcia" row continues to render unconditionally because it represents balance carry-over, not monthly activity.

## Risks / Trade-offs

- **Risk: Decimal serialisation changes the API contract.** → Mitigation: clients (the Next.js app) all live in this repo; we update them in lockstep. Added unit tests for `toDecimal` accepting `string | number | Prisma.Decimal` so any leftover number-coded code path keeps working during the refactor. Document in CHANGELOG.

- **Risk: Float→Decimal migration data loss for non-trivial values.** → Mitigation: PostgreSQL casts `double precision` → `numeric(14,4)` via standard SQL `CAST`; values up to ~15 significant digits round-trip without loss. Migration is a single `ALTER COLUMN ... TYPE numeric(14,4) USING <col>::numeric(14,4)`. Verified locally on a snapshot before merging.

- **Risk: Performance regression on monthly aggregates.** → Mitigation: `Decimal` arithmetic is ~10× slower than native `Float`, but volumes are tiny (12 months × N apartments × few years per page render). No measurable impact expected; we profile the dashboard render in the PR if anything looks off.

- **Risk: Admin users assigned apartments could accidentally show up in tenant-only flows** (e.g. dashboard apartment list). → Mitigation: tenant queries already filter by `userId = session.user.id`, so an admin viewing the tenant dashboard would see only apartments assigned to _their_ admin user — which is the intended behaviour. We add a regression test covering this.

- **Trade-off: Admins still won't appear in `/admin/users/management` bulk-assign.** → Accepted scope limit. If admins need bulk assignment later, the dropdown can be extended without breaking the per-user flow added here.

- **Risk: Hiding empty months might confuse users expecting to see all 12 months.** → Mitigation: yearly footer always shows full totals, opening/closing balances are always rendered. If user feedback requests an "always show all months" toggle later, it can be added behind a single boolean prop on `PaymentTable` without further refactors. We add a sentence to the user-facing release notes (CHANGELOG) explaining the new behaviour.

## Migration Plan

1. **Schema migration.** New Prisma migration `<timestamp>_charge_payment_decimal_precision` switches the listed `Float` columns to `Decimal(14,4)` via `ALTER TYPE ... USING <col>::numeric(14,4)`. Default values (`@default(0)`) are preserved.
2. **Code migration order** (per the tasks document):
   1. Money helpers (`src/lib/money/`) and validator/constants update.
   2. Parser update (return `Prisma.Decimal`).
   3. Importer update (`charges.ts`, `payments.ts`) — diff via `.equals()`, no recomputation.
   4. Schema migration applied.
   5. Display components (formatCurrency overload, sumDecimals).
   6. Empty-month filter wired into the four listings.
   7. Admin filter button + API param.
   8. Tests (unit + E2E).
3. **Rollback strategy.** The Prisma migration is reversible with `ALTER TYPE ... USING <col>::double precision` (no precision is gained on revert — values that fit `Float` will round-trip; we already validated they fit). Code rollback is a normal git revert. Admin filter is additive (purely UI + new query param) and does not require migration to roll back.

## Open Questions

None. All four clarifying questions were resolved with the user before drafting.
