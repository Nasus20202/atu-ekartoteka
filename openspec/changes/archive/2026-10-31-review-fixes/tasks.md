# Tasks

## 1. Share sort

- [x] 1.1 Generated `shareRatio` column migration and `dbgenerated` schema field; sort by it in `find-apartments-paginated.ts`; update `find-apartments-paginated.test.ts`; remove unused `apartmentShareRatio`.

- [x] 1.2 Expose `shareRatio` instead of numerator/denominator in apartment DTOs and display props; `formatSharePercent(shareRatio)` (Polish decimal comma) used by every view; tests in `share-percent.test.ts` and the card/table tests.

## 2. PDFs

- [x] 2.1 `toLocalIsoDate` with tests; use it in the notice, charges and payment PDF buttons.
- [x] 2.2 Group notices by HOA and label in `group-notifications.ts`; test for the same label in two HOAs.

## 3. Settings and dashboard

- [x] 3.1 Settings `PUT` returns 400 for a malformed JSON body; route test.
- [x] 3.2 Test that the `Naliczenia` card shows no previous-month tile without visible charges (`charges-summary-card-window.test.tsx`).

## 4. Lists and admin queries

- [x] 4.1 `useAvailableApartments` returns only the selected user's list; test.
- [x] 4.2 `useInfiniteList.refresh()` aborts in-flight requests; refresh tests split into `use-infinite-list-refresh.test.ts` with shared fixtures.
- [x] 4.3 Financial summary runs `groupBy` and the charges aggregate in parallel and groups the closing-balance filter by year; route test.

## 5. E2E SQL

- [x] 5.1 Move inline SQL from `scroll-test-hoa.ts`, `scroll-test-users.ts` and `admin-user-name-sort.spec.ts` to `e2e/test-data/seed/*.sql`.
