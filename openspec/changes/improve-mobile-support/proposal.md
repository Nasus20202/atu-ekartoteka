## Why

The authenticated areas of the app (dashboard, admin pages) were built with desktop-first, fixed spacing assumptions. On mobile viewports the layout breaks in multiple places: global padding leaves too little content width, data tables overflow their containers, 2-column grids crush Polish label text, action button bars compress or overflow, and charge item rows have a fixed-width price column that breaks on narrow screens. The navigation bar already handles mobile correctly; the rest of the app needs to catch up.

## What Changes

- Replace hard-coded `p-8` in the `<Page>` wrapper and dashboard home `<main>` with responsive padding (`p-4 md:p-8`)
- Add `action` prop to `PageHeader` to eliminate external `flex justify-between` wrappers that cause overflow (root cause of 3 issues)
- Replace the 2-button page-level action bar in admin users page with a `DropdownMenu` ("Akcje")
- Replace per-user-card action buttons in admin users page with a `DropdownMenu` (kebab pattern)
- Add `flex-wrap` to the 4-button status filter row in admin users page
- Wrap all wide data tables in `overflow-x-auto` (`PaymentTable`, import results table)
- Convert always-2-column summary grids with `text-2xl` values to `grid-cols-1 sm:grid-cols-2`
- Fix `ChargeItem` row: remove fixed `w-24` amount, add `shrink-0` to right group, stack on mobile with `flex-col sm:flex-row`
- Add `min-w-0 truncate` to `ApartmentSection` address, `shrink-0` to right group
- Add `shrink-0` to `PeriodCard` header right column and to `DownloadPaymentPdfButton` wrappers
- Fix `PaymentYearRow` to be fully tappable and to not overflow on mobile
- Fix `ApartmentCard` nav button row with `shrink-0` on button group
- Fix admin import stats grid breakpoints (`sm:grid-cols-4` → `sm:grid-cols-2 lg:grid-cols-4`)
- Fix admin users bulk-create page header and submit bar
- Fix admin apartments HOA page header with checkbox filter
- Add responsive type scale to `PageHeader` title (`text-2xl sm:text-3xl`)

## Capabilities

### New Capabilities

None — this change improves existing UI behaviour, it does not introduce new product capabilities.

### Modified Capabilities

- `visual-design`: Responsive spacing and layout rules are being extended. The existing spec covers the colour/typography system but does not codify mobile breakpoint behaviour for layout primitives. The delta spec adds mobile-first layout rules for the `<Page>` wrapper, info grids, action bars, and overflow handling.

## Non-Goals

- Dedicated mobile navigation redesign (navbar is already correct)
- Auth pages (already mobile-safe)
- Tablet-specific layouts beyond what responsive Tailwind classes naturally produce
- Any backend, API, or data model changes
- New dependencies

## Impact

- `src/components/page.tsx` — padding, affects every authenticated page
- `src/components/page-header.tsx` — add `action` prop, responsive title size
- `src/app/dashboard/page.tsx` — inline `<main>` padding
- `src/components/payment-table.tsx` — overflow-x-auto scroll wrapper
- `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx` — grid breakpoints, card header
- `src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx` — grid breakpoints, card header
- `src/app/admin/users/page.tsx` — dropdown for page actions, dropdown for per-card actions, flex-wrap filter row, modal overlay padding
- `src/app/admin/users/bulk-create/page.tsx` — page header, submit bar
- `src/app/admin/apartments/[hoaId]/page.tsx` — header with checkbox filter
- `src/app/admin/import/page.tsx` — overflow wrapper, grid breakpoints
- `src/components/charges/period-card.tsx` — ChargeItem layout, PeriodCard header
- `src/components/charges/multi-apartment-period-card.tsx` — ChargeItem layout, ApartmentSection header
- `src/components/payments/payment-year-row.tsx` — full-row tappable link, overflow fix
- `src/components/dashboard/apartment-card.tsx` — nav button row shrink-0
- No API, database, or auth changes; no new dependencies
