## Why

Three pain points have surfaced in production usage:

1. **Lost precision on sums** — the importer currently recomputes `quantity × unitPrice` and treats the file's `totalAmount` as a validation target only. For sub-grosz inputs (e.g. `42.05` ≠ `1.42 × 100.0725`) the recomputed value drifts from the source-of-truth ledger, so users see numbers that don't match their bills.
2. **Admin-managed apartments are invisible** — apartments that belong to internal/admin users (service units, common areas, management-held flats) cannot currently be assigned via the standard UI; the existing flow only exposes tenants in `/admin/users`. There is no way to filter and manage admin-owned apartments separately from tenants.
3. **Empty months clutter listings** — payment and charge tables always render all 12 months per year, even when both charge and payment are zero. This drowns useful rows in noise, especially mid-year and for inactive apartments.

## What Changes

- **Persist the file-provided `totalAmount` as the authoritative value.** Switch money columns from `Float` to Prisma `Decimal` so sub-grosz precision is preserved end-to-end, drop the `quantity × unitPrice` validator (it becomes informational only), and use the stored value everywhere we currently aggregate or display sums.
- **Migrate all monetary fields on `Charge` and `Payment` to `Decimal(14, 4)`** — including `unitPrice`, `quantity`, `totalAmount`, the 24 monthly columns, and the 4 balance columns. Update parsers, importers, validators, queries, aggregations, and display helpers accordingly. **BREAKING** for any code reading these as `number`.
- **Add an "Administratorzy" filter button** on `/admin/users` (next to "Odrzucone") that filters users by `role = ADMIN`. The existing per-user apartment-assignment UI is reused unchanged when the filter is active, so admins can be assigned apartments via the same flow as tenants.
- **Hide empty months in monthly listings** — in `payment-table.tsx`, `dashboard/payments-card.tsx`, `admin-payments-list.tsx`, and the user-facing yearly detail page, skip rendering rows where both `charges` and `payments` are zero. Yearly totals and footers stay accurate (computed from the full set, not the filtered rows).

## Capabilities

### New Capabilities

_None._ All changes modify existing capabilities.

### Modified Capabilities

- `data-import`: importer must persist the file's `totalAmount` verbatim (no recomputation), tolerate `quantity × unitPrice` mismatches as warnings, and round-trip values through `Decimal` without precision loss.
- `charges-and-payments`: monetary fields exposed via the API and rendered in the UI must use `Decimal` precision; monthly listings (charges and payments) must hide periods where both charges and payments are zero.
- `user-management`: the user listing must support filtering by `role = ADMIN`; admin users must be assignable apartments through the same per-user flow used for tenants.

## Impact

**Code:**

- `prisma/schema.prisma` — switch all monetary `Float` fields on `Charge` and `Payment` to `Decimal(14, 4)`.
- New Prisma migration converting existing `Float` data to `Decimal` (lossless on 64-bit floats with up to 4 fractional digits).
- `src/lib/parsers/parser-utils.ts`, `nal-czynsz-parser.ts`, `wplaty-parser.ts` — return `Prisma.Decimal` instead of `number`; preserve raw string when present.
- `src/lib/import/validators.ts`, `constants.ts` — keep the `quantity × unitPrice` check but mark its violations as **warnings**, not errors; cross-file and balance validators continue as errors.
- `src/lib/import/importers/charges.ts`, `payments.ts` — write `Decimal`s directly; diff comparisons must use `.equals()` not `===`.
- `src/lib/utils.ts` — `formatCurrency`, period helpers gain `Decimal` overloads; numeric reducers (`reduce((a, b) => a + b, 0)`) replaced by `Decimal` arithmetic.
- `src/components/payment-table.tsx`, `dashboard/payments-card.tsx`, `payments/admin-payments-list.tsx`, `app/dashboard/payments/[apartmentId]/[year]/page.tsx` — filter empty months, render `Decimal` via `formatCurrency`.
- `src/app/admin/users/page.tsx` — new "Administratorzy" filter button + state; `GET /api/admin/users` must accept a `role` query param.
- `src/app/api/admin/users/route.ts` — extend the listing query to filter by role.
- Tests: extend `__tests__/` for parsers, importers, validators, payment-table, charges-display; add E2E for the admin-filter assignment flow.

**APIs:**

- `GET /api/admin/users` — new optional `role` query param (`ADMIN` | `TENANT`).
- All endpoints serializing money — values now serialise as decimal strings (Prisma's default for `Decimal`); clients must parse accordingly.

**Dependencies:** none added. Prisma already supports `Decimal` natively via `Prisma.Decimal` (decimal.js-light).

**Non-goals:**

- Reworking the visual design of payment tables or admin user pages.
- Backfilling history beyond what the next import will write — already-imported `Float` totals are migrated as-is to `Decimal` (existing rounding errors stay until re-imported).
- Adding a new "rejected apartments" grouper or changing how user rejection clears apartment assignments.
- Adding a separate bulk-assign mode for admins on `/admin/users/management` — that page is intentionally left tenant-focused.
- Per-apartment "assign to admin" action on the apartment detail page.
