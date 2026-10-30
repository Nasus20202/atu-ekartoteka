# Tasks

## 1. Database filtering

- [x] 1.1 Extract `buildApartmentsWhere` (`api/admin/apartments/apartments-where.ts`) with `assignableTo`, email and full-label search; unit tests.
- [x] 1.2 `useAvailableApartments` queries the API with `assignableTo` and the debounced search; `pinSelectedAndMatching` replaces in-browser filtering; tests.
- [x] 1.3 `usePendingCount` reads the pending total from the API; page test and hook tests.
- [x] 1.4 Financial summary uses `groupBy` and `aggregate`; route tests.

## 2. Redundant sorting

- [x] 2.1 Drop in-memory sorts in the unassigned apartments route, admin payments list and admin charges list; delete the unused `apartment-sort` helper.

## 3. Verification

- [x] 3.1 `pnpm lint`, `pnpm vitest run` and the admin Playwright project.
