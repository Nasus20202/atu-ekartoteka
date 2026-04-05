## 1. Layout Primitives

- [x] 1.1 In `src/components/page.tsx`, change `p-8` to `p-4 md:p-8` on the `<main>` element
- [x] 1.2 In `src/app/dashboard/page.tsx`, change the inline `<main className="p-8">` to `<main className="p-4 md:p-8">`
- [x] 1.3 In `src/components/page-header.tsx`: add `action?: React.ReactNode` prop; render it in the component's own `flex items-center justify-between` wrapper; add `min-w-0` to the title `<div>`; change `text-3xl font-bold` to `text-2xl sm:text-3xl font-bold`

## 2. Admin Users Page — Action Bar & Filters (DropdownMenu)

- [x] 2.1 In `src/app/admin/users/page.tsx` (lines ~327–364): remove the external `flex items-center justify-between` wrapper; pass the action buttons as the `action` prop to `PageHeader`; replace the two buttons ("Dodaj użytkownika", "Utwórz wiele kont") with a single `DropdownMenu` trigger ("Akcje") containing both as `DropdownMenuItem` elements
- [x] 2.2 In `src/app/admin/users/page.tsx` (lines ~378–410): add `flex-wrap` to the 4-button status filter row (`<div className="mb-6 flex gap-2">` → `<div className="mb-6 flex flex-wrap gap-2">`)
- [x] 2.3 In `src/app/admin/users/page.tsx` (lines ~479–549): replace per-user-card action buttons with a `DropdownMenu` kebab trigger; preserve the destructive styling for the "Odrzuć" item using `text-destructive` on its `DropdownMenuItem`
- [x] 2.4 In `src/app/admin/users/page.tsx`: add `p-4` to all modal overlay `div`s so modal cards have ≥ 16 px edge clearance on mobile

## 3. Other Page Header Action Bars

- [x] 3.1 In `src/app/admin/users/bulk-create/page.tsx` (lines ~120–129): remove the external flex wrapper; pass "Powrót" button as the `action` prop to `PageHeader`
- [x] 3.2 In `src/app/admin/users/bulk-create/page.tsx` (lines ~162–173): add `shrink-0` to the submit `<Button>` so it is never compressed by the count text
- [x] 3.3 In `src/app/admin/apartments/[hoaId]/page.tsx` (lines ~120–141): remove the external flex wrapper; pass the "Tylko aktywne" checkbox as the `action` prop to `PageHeader`; add `shrink-0` to the checkbox div

## 4. Data Tables — Horizontal Scroll

- [x] 4.1 In `src/components/payment-table.tsx`: wrap the `<Table>` in `<div className="overflow-x-auto">` so the 4-column table scrolls on narrow screens
- [x] 4.2 In `src/app/admin/import/page.tsx` (lines ~206–235): wrap the 6-column import results `<Table>` in `<div className="overflow-x-auto">`
- [x] 4.3 In `src/app/admin/import/page.tsx` (lines ~451, ~496): change `sm:grid-cols-4` to `sm:grid-cols-2 lg:grid-cols-4` so the stats grid has an intermediate breakpoint

## 5. Info Grids — Responsive Columns

- [x] 5.1 In `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx` (lines ~128–163): change the 4-cell summary stats grid from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`; also add `flex-wrap gap-2` and `shrink-0` to the card header PDF button area (lines ~112–125)
- [x] 5.2 In `src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx`: change all `grid-cols-2` info grids with `text-2xl` values to `grid-cols-1 sm:grid-cols-2`; add `flex-wrap gap-2` and `shrink-0` to the card header PDF button area

## 6. Charge Item Row

- [x] 6.1 In `src/components/charges/period-card.tsx`: update the `ChargeItem` outer container to `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`; add `shrink-0` to the right group (`<div className="flex items-center gap-4 text-right shrink-0">`); remove the fixed `w-24` from the amount `<p>` and replace with `whitespace-nowrap font-bold`
- [x] 6.2 In `src/components/charges/multi-apartment-period-card.tsx`: apply the identical `ChargeItem` layout changes (the JSX is duplicated)

## 7. Charge Card & Apartment Section Headers

- [x] 7.1 In `src/components/charges/period-card.tsx` (lines ~51–68): add `shrink-0` to the right column `<div className="flex flex-col items-end gap-2">` so it is never compressed
- [x] 7.2 In `src/components/charges/multi-apartment-period-card.tsx` (lines ~53–65): add `min-w-0` to the address `<h3>` and `truncate`; add `shrink-0` to the right group (PDF button + total); add `flex-wrap gap-2` to the header container

## 8. Payment Year Row

- [x] 8.1 In `src/components/payments/payment-year-row.tsx`: make the outer `<div>` a `<Link>` wrapping all content (year/date, PDF button, balance); add `hover:bg-muted/50 transition-colors` for visual feedback; add `flex-wrap gap-2` to handle narrow screens; add `min-w-0` to the date/year section; ensure the PDF button uses `e.preventDefault()` + `e.stopPropagation()` to avoid double-navigation

## 9. Apartment Card Nav Buttons

- [x] 9.1 In `src/components/dashboard/apartment-card.tsx` (lines ~50–71): add `shrink-0` to the `<div className="flex flex-row gap-1">` nav button group so it is never compressed by the apartment address

## 10. Verification

- [x] 10.1 Run `pnpm lint` and fix any ESLint errors
- [x] 10.2 Run `pnpm test` and ensure all unit tests pass
- [x] 10.3 Manually verify at 375 px viewport: no horizontal overflow on any page, charge rows stack, payment table scrolls, summary grids are single-column, modals have edge clearance, admin user actions open as dropdowns
