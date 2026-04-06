## Context

The ATU Ekartoteka web application currently has several UX and functional gaps across its charges, payments, import, notifications, and user management flows. This design covers eleven distinct improvements grouped into cohesive areas: financial display enhancements, navigation improvements, import pipeline hardening, HOA metadata extension (header/footer), and admin panel UX improvements.

Key constraints:

- Admin pages use `'use client'` with direct `fetch`/`useState`/`useEffect` (no SWR/React Query).
- Files must not exceed 200 lines; large pages must be split into sub-components.
- DB changes go through Prisma migrations.
- All amounts must be displayed as exact decimal values (no rounding).
- UI labels and content in Polish; code and commits in English.

## Goals / Non-Goals

**Goals:**

- Collapsible year/month navigation in charge period lists (tenant dashboard).
- Bilans otwarcia row shows real `openingDebt` / `openingSurplus` values from DB instead of `-`.
- Colour-coded opening balance (red = negative, green = positive/zero).
- Per-month link from payments detail to naliczenia for that month.
- Validation of `nal_czynsz.txt` entries during import; surface errors before DB commit.
- WMB files tracked per data type (`lokal`, `nalicz`, `pow_czynsz`); data-as-of date shown per entity in admin import panel.
- HOA header/footer parsed from `pow_czynsz.txt`, stored in DB on import, displayed in charge notifications.
- Exact (non-rounded) amounts in charge notifications.
- Full apartment data (address, share, external IDs, active status) in admin user listing cards.
- Mathematical (natural) apartment sort throughout.
- Bulk account creation: inactive apartments disabled by default with opt-in confirmation dialog.
- Per-HOA financial summary: total closing balance and total charges due.

**Non-Goals:**

- Payment import validation (only naliczenia in scope).
- Tenant-facing HOA header/footer editing.
- Full financial reporting.

## Decisions

### 1. Collapsible Year/Month Period Navigation

**Decision**: Client-side accordion using shadcn/ui `Collapsible` or `Accordion` components. Years are top-level collapsible rows; months are nested items inside.

**Rationale**: The existing `period-card.tsx` renders flat items. Wrapping in an `Accordion` requires no new data fetch — periods are already grouped by a `YYYY-MM` string. The year is extracted via `period.slice(0, 4)`.

**Alternative considered**: Paginated server-side year filter. Rejected as overkill for the typical data volume (< 36 periods per apartment).

---

### 2. Opening Balance Colour Coding

**Decision**: Apply Tailwind conditional classes `text-red-600` (balance < 0) and `text-green-600` (balance ≥ 0) to the `Saldo początkowe` value wherever it is displayed (tenant payment detail page, admin apartment detail page).

**Rationale**: No new component needed; purely presentational. Uses existing shadcn/ui colour conventions.

---

### 3. Wpłaty → Naliczenia Link

**Decision**: In `src/components/payment-table.tsx`, each month row's charge cell becomes a Next.js `<Link>` pointing to `/dashboard/charges/[apartmentId]?month=YYYY-MM`. The charges page reads the `month` query param and auto-expands (or scrolls to) that period.

**Alternative considered**: Separate modal overlay. Rejected — navigation is simpler and preserves deep-linkability.

---

### 4. Import Validation

**Decision**: Run a validation pass after parsing, before the Prisma transaction, for both `nal_czynsz.txt` and `wplaty.txt`. Errors abort the import for that HOA and are surfaced in the existing result card UI via `ImportError[]`.

#### `nal_czynsz.txt` validation rules

- `quantity` must be > 0.
- `unitPrice` must be ≥ 0.
- `totalAmount` must equal `quantity × unitPrice` within ±`NAL_AMOUNT_TOLERANCE` (constant, default `0.01`).
- `dateFrom` must be ≤ `dateTo`.
- `apartmentExternalId` must reference a known apartment in the current HOA (cross-checked against parsed `lok.txt` entries).
- `id` must be unique within the file.

#### `wplaty.txt` validation rules

The closing balance must satisfy the accounting identity:

```
closingBalance = openingBalance + totalPayments - totalCharges
```

where:

- `openingBalance = openingSurplus - openingDebt` (fields 7 − 6)
- `totalPayments = sum of monthly payments` (fields at positions 11, 13, 15, ..., 33 in 1-based indexing)
- `totalCharges = sum of monthly charges` (fields at positions 10, 12, 14, ..., 32 in 1-based indexing)

The computed closing balance must match the file's `closingBalance` (field 34) within ±`WPLATY_BALANCE_TOLERANCE` (constant, default `0.01`).

This cross-file sum check catches truncated files, corrupt field values, and off-by-one parsing errors before any data reaches the DB.

**Rationale**: Early validation prevents partial DB corruption. The existing `ImportError` type and UI already support surfacing errors per HOA.

---

### 5. WMB Files Tracked Per Data Type

**Decision**: The three `.wmb` files map to specific data types by name:

- `lokal_ost_wys.wmb` → apartments
- `nalicz_ost_wys.wmb` → charges
- `pow_czynsz_ost_wys.wmb` → notifications

Each contains a single line with a `YYYYMMDD` date string (e.g. `20251130`).

`ImportFileGroup` in `src/lib/import/types.ts` gains three new optional fields:

```ts
interface ImportFileGroup {
  // existing…
  apartmentsWmbFile?: File;
  chargesWmbFile?: File;
  notificationsWmbFile?: File;
}
```

`groupFilesByHOA` in `src/lib/import/utils.ts` is updated to route each `.wmb` filename to the correct field. A new `parseWmbDate(buffer: Buffer): Promise<Date | undefined>` utility parses the `YYYYMMDD` string and returns a `Date` object (midnight UTC) or `undefined` on failure.

The parsed dates are **stored in the DB** on the `HomeownersAssociation` model:

```prisma
model HomeownersAssociation {
  // existing…
  apartmentsDataDate     DateTime?
  chargesDataDate        DateTime?
  notificationsDataDate  DateTime?
}
```

**DB migration**: `prisma migrate dev --name add-hoa-wmb-data-dates`. All three fields are nullable — existing rows get `NULL`, populated on first import. Updated on every reimport (same as header/footer).

The import handler writes these dates inside the HOA transaction alongside other import operations. The admin import result card reads them from `HOAImportResult` (populated from the parsed files, not re-queried from DB) and renders them per entity type.

`HOAImportResult` gains:

```ts
interface HOAImportResult {
  // existing…
  apartmentsDataDate?: Date;
  chargesDataDate?: Date;
  notificationsDataDate?: Date;
}
```

**Rationale**: Storing as `DateTime` in the DB means the dates are available at any time for audit purposes, not only during the import response. Each data type may have a different snapshot date — per-type storage preserves this granularity.

---

### 6. HOA Header/Footer — Saved on Notification Import

**Decision**: The `pow_czynsz.txt` file contains the header (lines before the first standalone `#` separator) and footer (lines between the first and second `#` separator). The current parser (`parsePowCzynszFile`) already returns `header: string[]` and `footer: string[]` in its `ParseResult` but these are discarded by the import handler.

During notification import (`importNotifications`), after the upsert logic, update the HOA record with the latest header and footer:

```ts
await tx.homeownersAssociation.update({
  where: { id: hoa.id },
  data: {
    header: notificationData.header.join('\n') || null,
    footer: notificationData.footer.join('\n') || null,
  },
});
```

This means every notification reimport overwrites the stored header/footer with the latest file contents — intentional, as `pow_czynsz.txt` is the authoritative source.

**DB migration**: `prisma migrate dev --name add-hoa-header-footer`. Adds `header String?` and `footer String?` to `HomeownersAssociation`. Both are nullable with no default — existing rows get `NULL`, which is correct (header/footer populated on first import).

**Display**: Charge notifications sidebar (`notifications-sidebar.tsx`) and card (`charge-notifications-card.tsx`) read `header` from the HOA record (available via `apartment.homeownersAssociation`) and render it above the notification list when present.

---

### 6a. Bilans Otwarcia — Real Wpłaty/Naliczenia Values

**Problem**: The "Bilans otwarcia" row in `payment-table.tsx` and `payment-pdf-document.tsx` hardcodes `-` for the Wpłaty and Naliczenia columns. The `wplaty.txt` file contains `openingDebt` (field 6) and `openingSurplus` (field 7) — currently parsed but used only to compute `openingBalance = openingSurplus - openingDebt`. These raw values are not stored.

**Decision**: Store `openingDebt` and `openingSurplus` as dedicated fields on the `Payment` model:

```prisma
model Payment {
  // existing…
  openingDebt    Float  @default(0)
  openingSurplus Float  @default(0)
}
```

Migration: `prisma migrate dev --name add-payment-opening-debt-surplus`.

- `wplaty-parser.ts`: already parses both values; expose them on `PaymentEntry`.
- `payments.ts` importer: write `openingDebt` and `openingSurplus` to the DB.
- `payment-table.tsx`: render `openingSurplus` in the Wpłaty column and `openingDebt` in the Naliczenia column for the Bilans otwarcia row, with the same colour coding as the balance.
- `payment-pdf-document.tsx`: same change applied to the PDF opening row.

**Rationale**: `openingDebt` represents what was owed at the start of the period (naliczenia carried forward), and `openingSurplus` represents overpayment carried forward (wpłaty). Displaying them gives tenants and admins a complete picture of the opening position.

---

### 7. Charge Notification Amounts — Fix Parser (Root Cause)

**Root cause**: In `parsePowCzynszFile`, the `quantity` and `unitPrice` fields are parsed with plain `parseFloat` without replacing the comma decimal separator first. Since the source file uses Polish locale formatting (e.g. `45,89` and `1,2300`), `parseFloat` stops at the comma and truncates to an integer (`45` and `1`). Only `totalAmount` correctly applies `.replace(',', '.')`. The values are stored as truncated integers in the DB.

**Fix**: Apply `.replace(',', '.')` before `parseFloat` consistently for all numeric fields in `parsePowCzynszFile`:

```ts
const quantity = parseFloat(parts[4].replace(',', '.').trim());
const unitPrice = parseFloat(parts[6].replace(',', '.').trim());
const totalAmount = parseFloat(parts[7].replace(',', '.').trim());
```

**Data repair**: Existing `ChargeNotification` records in the DB have incorrect `quantity` and `unitPrice` values. These are corrected automatically on the next import run (upsert logic in `importNotifications` detects changes via `hasNotificationChanged` and updates the record).

**Display**: The `.toFixed(2)` calls in `notifications-sidebar.tsx` and `charge-notifications-card.tsx` are correct for formatting — no display change needed once the stored values are accurate floats.

---

### 8. User Listing: Apartment Data

**Decision**: The existing user card in `src/app/admin/users/page.tsx` already fetches assigned apartments (lines 470–492). Extend the displayed data per apartment to include all relevant fields from the `Apartment` model:

- Address line: `{address} {building}/{number}, {postalCode} {city}`
- Ownership share: `{shareNumerator}/{shareDenominator}` (udziały), shown only when both values are present
- External IDs: `externalOwnerId` and `externalApartmentId` for admin reference
- Active status: `isActive` badge — "Aktywny" (green) or "Nieaktywny" (grey)

The API query for the user list must be extended to `include` these apartment fields if they are not already selected.

---

### 9. Mathematical Apartment Sorting

**Decision**: Replace current sort in `src/app/api/admin/apartments/route.ts` (line 94–111) with a natural sort comparator that:

1. Compares `building` values using `localeCompare` with `numeric: true` option.
2. If buildings are equal, compares `number` values using `localeCompare` with `numeric: true`.

Apply the same comparator to any client-side sort (user management apartment picker in `src/app/admin/users/page.tsx` lines 261–282).

**BREAKING**: Sort order changes for apartments whose building or number fields contain mixed numeric/alpha values (e.g., "10" now sorts after "9" instead of before it).

**Alternative considered**: Postgres `ORDER BY` with `NULLS LAST` and cast to integer. Rejected because building values are not always numeric.

---

### 10. Bulk Account Creation: Inactive Apartments and Confirmation

**Decision**:

- The `UnassignedApartment` type in `HoaCard.tsx` is extended with `isActive: boolean`. The API endpoint (`GET /api/admin/unassigned-apartments?mode=creatable`) already has access to this field via the `Apartment` model — include it in the response.
- In `HoaCard.tsx`, apartments where `isActive === false` are rendered visually disabled: muted styling, a "Nieaktywny" badge, and the checkbox is non-interactive by default.
- When the admin clicks on a disabled (inactive) apartment row, an `AlertDialog` (shadcn/ui) is shown asking for confirmation before adding it to the selection.
- If the admin confirms, the apartment is added to the selection and treated like any other — it can then be submitted for account creation.
- Inactive apartments that have not been explicitly confirmed remain unselectable and are never submitted.

**Confirmation dialog copy**:

- Title: `Nieaktywne mieszkanie`
- Body: `To mieszkanie nie jest aktywne w ostatnim imporcie danych. Czy na pewno chcesz utworzyć dla niego konto?`
- Cancel: `Anuluj` / Confirm: `Tak, utwórz konto`

**Rationale**: Inactive apartments (`isActive === false`) are likely stale or removed from the HOA source system. Disabling them by default prevents accidental invitations, while the opt-in confirmation allows intentional edge-case use without fully blocking it.

---

### 11. Per-HOA Financial Summary

**Decision**: Add a new section to the admin HOA list page (`src/app/admin/apartments/page.tsx`) and/or a dedicated summary card per HOA showing:

- **Łączne saldo wszystkich lokali** (sum of closing balances across all apartments in the HOA, for the latest available year).
- **Łączna kwota do zapłaty** (sum of total charges due across all apartments in the HOA, for the current period).

**New API endpoint**: `GET /api/admin/hoa/[hoaId]/financial-summary`

Response:

```ts
{
  totalClosingBalance: number;
  totalChargesDue: number;
  period: string; // YYYY-MM of the most recent period with data
}
```

Implementation queries `Payment` and `Charge` tables grouped by HOA → apartment, aggregates in Prisma. Displayed in the existing HOA card.

## Risks / Trade-offs

- **Mathematical sort breaking existing expectations** → Communicate breaking change clearly in commit message and release notes. Sort change is isolated to the API route and one client-side comparator function.
- **WMB date parsing fragility** → If `.wmb` format varies across HOAs, date extraction may fail silently. Mitigation: treat missing/unparseable date as `undefined` and display "Nieznana" in the UI rather than crashing.
- **Validation strictness** → Legacy source files may have accumulated floating-point rounding inconsistencies (e.g. `totalAmount` slightly off from `quantity × unitPrice`, or `closingBalance` off by a cent). Mitigation: use configurable tolerance constants (`NAL_AMOUNT_TOLERANCE`, `WPLATY_BALANCE_TOLERANCE`, both default `0.01`) and log the exact delta with each validation failure so it can be tuned if needed.
- **HOA header/footer overwrite on reimport** → Every notification reimport overwrites `header`/`footer`. This is intentional — the file is the source of truth. Admins cannot manually edit these fields.
- **Per-HOA financial summary performance** → Aggregating across all apartments and years could be slow for large HOAs. Mitigation: limit query to the most recent year; add DB index on `Payment(apartmentId, year)` if needed.

## Migration Plan

All migrations MUST preserve existing data. The following rules apply to every migration in this project (captured as the `db-migration` capability):

- New columns are added as **nullable** or with a **safe default** so existing rows are valid immediately after migration.
- If a non-nullable column without a default is needed, a two-step migration is used: (1) add nullable, (2) backfill, (3) add `NOT NULL` constraint.
- Dropping a column or changing a type requires a documented backfill or archival plan executed before the destructive step.
- Every migration is reviewed for reversibility; rollback steps are noted.

### Migration 1: `add-hoa-header-footer`

Adds `header String?` and `footer String?` to `HomeownersAssociation`.

- Existing rows: `NULL` for both — correct, fields are populated on first notification import.
- Rollback: drop both columns (no data loss, values come from reimport).

### Migration 2: `add-hoa-wmb-data-dates`

Adds `apartmentsDataDate DateTime?`, `chargesDataDate DateTime?`, `notificationsDataDate DateTime?` to `HomeownersAssociation`.

- Existing rows: `NULL` for all three — correct, populated on first reimport.
- Rollback: drop the three columns.

### Migration 3: `add-payment-opening-debt-surplus`

Adds `openingDebt Float @default(0)` and `openingSurplus Float @default(0)` to `Payment`.

- Existing rows: default `0` for both. Historical payment records will show `0`/`0` in the Bilans otwarcia row until reimported. Corrected automatically on the next import run.
- Rollback: drop both columns (payment records remain valid; Bilans otwarcia row reverts to `-`).

## Open Questions

- Should the per-HOA financial summary use the latest available year per apartment, or a fixed current year? → Assuming latest available year per apartment for maximum accuracy.
