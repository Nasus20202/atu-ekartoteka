# Tasks

## 1. Shared view mode building blocks

- [x] 1.1 Implement `useListViewMode` with `ListViewMode` (cards/table) and `LIST_VIEW_STORAGE_KEYS` in `src/lib/hooks/use-list-view-mode.ts` (useSyncExternalStore, cards on server and by default, unknown or removed stored values → cards, storage errors fall back to memory, `storage` event sync); verify with `src/lib/hooks/__tests__/use-list-view-mode.test.ts` covering default, restore, per-key independence, unknown value and throwing storage
- [x] 1.2 Implement the reusable `SegmentedControl` in `src/components/ui/segmented-control.tsx` (generic options list with optional icons, `aria-pressed`, keyboard operable) and `ListViewSwitch` with the `Kafelki`/`Tabela` options; verify with `src/components/ui/__tests__/segmented-control.test.tsx` and `src/components/ui/__tests__/list-view-switch.test.tsx`
- [x] 1.3 Implement `ViewTransition` in `src/components/ui/view-transition.tsx` with the `view-switch` keyframes in `tailwind.config.ts`, disabled for reduced motion

## 2. Apartments table

- [x] 2.1 Extract `ApartmentStatusBadge` and `DuplicateAddressBadge` into `admin/apartments/[hoaId]/apartment-badges.tsx` and extract `formatApartmentShare`/`apartmentShareRatio` into `apartment-list-utils.ts`; verify existing `apartment-card.test.tsx` passes unchanged
- [x] 2.2 Add `ApartmentTable` (`apartment-table.tsx`) per design §3; verify with `__tests__/apartment-table.test.tsx` (headers, label, owner, share, status, link href, inactive muted, duplicate badge, unknown share, no external IDs)
- [x] 2.3 Wire `useListViewMode(LIST_VIEW_STORAGE_KEYS.apartments)`, `ListViewSwitch` and `ViewTransition` into `admin/apartments/[hoaId]/page.tsx` (switch next to `Tylko aktywne`); verify with `pnpm lint` and `pnpm vitest run src/app/admin/apartments`

## 3. Users table

- [x] 3.1 Extract `UserActionButtons` and `UserActionMenu` into `admin/users/user-actions.tsx` and use them in `UserCard`; verify existing `user-card.test.tsx` and `page.test.tsx` pass unchanged
- [x] 3.2 Add `UsersTable` (`users-table.tsx`) per design §3; verify with `__tests__/users-table.test.tsx` (name/email fallback, status badge, pluralised apartment count, per-status menu actions call the right handlers)
- [x] 3.3 Wire `useListViewMode(LIST_VIEW_STORAGE_KEYS.users)`, `ListViewSwitch` and `ViewTransition` into `admin/users/page.tsx` via `users-list.tsx` (switch at the end of the filter row); add a page test that switching to `Tabela` renders the table without a new users request; verify `pnpm lint` and `pnpm vitest run src/app/admin/users`

## 4. Column sorting

- [x] 4.1 Add `src/lib/utils/sort.ts` (`SortDirection`, `SortState`, `ApartmentSortKey`, `UserSortKey`, `toggleSort`) and the reusable `SortableTableHead` with `aria-sort` and direction icons
- [x] 4.2 Accept `sort`/`order` in `GET /api/admin/apartments`, order `findApartmentsPaginated` in the database (Prisma `orderBy` over `pl_numeric`-collated columns) by label, owner, share and status, and move the apartment sort state into `useHoaApartments` (part of the infinite-list `queryKey`); verify with `apartment-table.test.tsx` (sort request, toggle direction) and `find-apartments-paginated.test.ts` (page order per sort and direction)
- [x] 4.3 Accept and validate `sort`/`order` in `GET /api/admin/users`, map them to Prisma `orderBy` in `findTenantUsers` for name (nulls last), email, status and apartment count, and move the user sort state into `useAdminUsers`; verify with `users-table.test.tsx`, `find-tenant-users.test.ts` and the users page test (sorted request)

## 5. End-to-end coverage

- [x] 5.1 Update Playwright E2E `e2e/admin/admin-list-view.spec.ts`: on the scroll test HOA switch to `Tabela`, headers are shown, the view change animates, sorting sends `sort`/`order` to the API and toggles, scrolling appends all rows in the sorted order, a row opens details, reload keeps the table view, the users list still opens in cards, and switching users to `Tabela` sorts through the API with a working `Akcje` menu; verify with `pnpm playwright test e2e/admin/admin-list-view.spec.ts --project=chromium-admin`

## 6. Integration check

- [x] 6.1 Run `pnpm lint`, `pnpm vitest run` and the admin Playwright project; check both views at 390 px and desktop in light and dark mode with no horizontal page scroll, and confirm no hydration warnings in the browser console
