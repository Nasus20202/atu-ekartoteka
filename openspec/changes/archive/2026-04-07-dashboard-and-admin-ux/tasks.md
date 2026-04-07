## 1. HOA Admin Cards — Import Dates (remove financial summary)

- [x] 1.1 Extend `findHoas` in `src/lib/queries/hoa/find-hoas.ts` to select `apartmentsDataDate`, `chargesDataDate`, `notificationsDataDate`
- [x] 1.2 Update `GET /api/admin/hoa/route.ts` to include these date fields in the response (add to the mapped object)
- [x] 1.3 In `src/app/admin/apartments/page.tsx`: extend the `HOA` interface with the three date fields, remove the financial summary fetch (`/api/admin/hoa/[hoaId]/financial-summary`), remove `summaries` state, and instead render import dates in the card using data from the HOA list response

## 2. Dashboard Payments Summary Per HOA

- [x] 2.1 Update `findUserWithApartmentsCached` (or its underlying query) to include `homeownersAssociation { id, name }` on each apartment — verify it already fetches this, if yes skip
- [x] 2.2 Update `src/app/dashboard/page.tsx` to group `latestPayments` by HOA (using `homeownersAssociationId` and `hoaName`), and pass per-HOA groups to `PaymentsSummaryCard`
- [x] 2.3 Rewrite `src/components/dashboard/payments-summary-card.tsx`: accept `hoaGroups: Array<{ hoaName: string; totalClosingBalance: number }>` plus a `grandTotal`, render one row per HOA with colour-coded balance, then a grand total row

## 3. Collapsible Year Groups on Payments Pages

- [x] 3.1 Create `src/components/payments/payments-year-list.tsx` as a `'use client'` component that wraps a list of payment years in collapsible sections (one per year) using `Collapsible` from `src/components/ui/collapsible.tsx`; each collapsed row shows year + date range + closing balance, expanded shows `PaymentYearRow`
- [x] 3.2 Use `PaymentsYearList` in `src/app/dashboard/payments/page.tsx` — replace the flat `PaymentYearRow` list inside each apartment card
- [x] 3.3 Use `PaymentsYearList` in `src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx` — replace the flat payments list

## 4. Pagination on Admin User List

- [x] 4.1 Update `findTenantUsers` in `src/lib/queries/users/find-tenant-users.ts` to accept `page: number` and `limit: number` parameters; use `skip`/`take`; also return total count via `prisma.user.count`
- [x] 4.2 Update `GET /api/admin/users/route.ts` to accept `page` and `limit` query params, call the updated query, return `{ users, pagination: { page, limit, total, totalPages } }`
- [x] 4.3 Update `src/app/admin/users/page.tsx` to add pagination state (`page`, `totalPages`), pass `page` to fetch, render pagination controls (prev/next buttons with page info) below the user list; reset page to 1 on filter change

## 5. HOA Header in Dashboard Apartment List

- [x] 5.1 Verify `findUserWithApartmentsCached` already fetches `homeownersAssociation.header` per apartment — if not, add it
- [x] 5.2 Update `src/components/dashboard/apartments-section.tsx`: group apartments by `homeownersAssociationId`, for each group show HOA header (if non-null) as a section label above the apartments

## 6. Notifications Grouped by HOA

- [x] 6.1 Update `src/components/dashboard/notifications-sidebar.tsx`: group notifications by HOA (using `hoaHeader` + a new `hoaName` field passed through from the dashboard), render one section per HOA with the HOA header (if set) followed by notification items; show per-HOA subtotal
- [x] 6.2 Update `src/app/dashboard/page.tsx` to pass `hoaName` alongside `hoaHeader` in the `allNotifications` array (already has `hoaHeader`, add `hoaName` from `apt.homeownersAssociation?.name`)
- [x] 6.3 Update `src/components/charges/multi-charges-display.tsx`: group charge notification items by HOA (using apartment's HOA name/header) rather than per apartment
