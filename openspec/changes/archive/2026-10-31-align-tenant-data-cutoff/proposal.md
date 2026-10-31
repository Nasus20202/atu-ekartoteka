# Proposal

## Why

Tenant views disagree about how far the data reaches. The charges pages hide months after the HOA's `.wmb` snapshot date (`chargesDataDate`), while the dashboard cards and charts run up to today. A tenant sees October 2026 on the dashboard but the charges list ends in August 2026. The snapshot date only mirrors an import file and says nothing about which months actually carry charges. Separately, the balance chart tooltip text is always black, so it is unreadable in dark mode.

## What Changes

- Replace the `.wmb` snapshot date as the tenant-facing cutoff with the **latest month that has a charge in the tenant's payment records** (`Payment` monthly charge columns), capped at the current month.
- Use that single cutoff in every tenant view: dashboard current/previous month tiles, charge trend chart, balance chart and balance rows, the combined and per-apartment charges lists, and the payment detail table.
- **BREAKING**: charges and payment months after the `.wmb` snapshot date but within the payments' last charged month become visible; months the payments never charged stay hidden. Changing the date manually is not offered, as the data-derived cutoff makes it unnecessary.
- Keep importing and storing `chargesDataDate` for the admin HOA list and import result; it no longer filters anything.
- Fix chart tooltips so label and values use the theme foreground colour in both light and dark mode.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `charges-and-payments`: the "Skip Empty Months in Monthly Listings" requirement stops hiding months by `chargesDataDate` and uses the payments-derived cutoff; the dashboard charge trend and balance requirements anchor on that cutoff instead of the current month.
- `visual-design`: chart tooltips stay readable in dark mode.

## Impact

- Code: `src/lib/utils/period.ts` and a new cutoff helper next to `payment-months.ts`; `src/app/dashboard/dashboard-data.ts`, `page.tsx`; `src/app/dashboard/charges/**`; `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`; `src/components/charges/{charges-display,multi-charges-display}.tsx`; `src/components/payments/payment-table.tsx`; `src/components/charts/chart-styles.ts`; `src/lib/queries/users/find-user-with-apartment-charges.ts`.
- Tests: unit tests for the cutoff helper and the filtering components, chart tooltip style test, e2e check that dashboard and charges list end on the same month.
- No schema change, no migration, no new dependency.
