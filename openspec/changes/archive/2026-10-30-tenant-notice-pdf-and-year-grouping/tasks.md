# Tasks

## 1. Current notice PDF

- [x] 1.1 Expose the HOA footer to notifications and share the apartment grouping.
  - Add `footer` to the HOA select in `findUserWithApartments`.
  - Add `hoaFooter` to `NotificationItem` and `buildDashboardNotifications`.
  - Extract the apartment grouping into `src/components/dashboard/group-notifications.ts` and use it in `HoaNotificationCard`.
  - Verify: update `dashboard-data.test.ts` and `user-queries.test.ts`, add unit tests for the grouping, and confirm the existing notification card tests still pass.
- [x] 1.2 Add the `PdfNoteText` primitive and `src/components/pdf/notice-pdf-document.tsx`, with one page per apartment showing the header, title, table, total and optional footer.
  - Verify: tests in `src/components/pdf/__tests__/notice-pdf-document.test.tsx` cover the page count, the header and footer shown or missing, and the totals.
- [x] 1.3 Add `DownloadNoticePdfButton` (dynamic imports, filename `naliczenia-biezace-YYYY-MM-DD.pdf`) and place it on the right of the `Łączna kwota do zapłaty` box in `NotificationsSidebar`.
  - Verify: extend `download-pdf-buttons.test.tsx` and the sidebar tests to check that the button is present and the filename is correct.
- [x] 1.4 Extend `e2e/pdf/tenant.spec.ts`: clicking the dashboard notice button downloads `naliczenia-biezace-*.pdf`.
  - Verify: `pnpm playwright test e2e/pdf/tenant.spec.ts` passes.

## 2. Admin year grouping

- [x] 2.1 Group `AdminChargesList` by year using `groupByYearDesc`, `YearTrigger` and `useChargeListOpenState(newestYear, null)`.
  - Verify: unit tests check the year order, that the newest year is open with its months closed, and that older years are closed.
- [x] 2.2 Make `AdminPaymentsList` open the newest stored year, and remove the unused `currentYear` prop from it, from `ApartmentPaymentsSection` and from the admin apartment page.
  - Verify: update the admin page and payments list tests, update `e2e/admin/admin-apartment-details.spec.ts` for the year sections, and confirm it passes.

## 3. Integration checks

- [x] 3.1 Run `pnpm lint`, `pnpm prettier --check .`, `pnpm vitest --run` and the full `pnpm playwright test`.
  - Confirm no touched file exceeds 200 lines.
  - Update visual snapshots only for the notification box and the admin lists.

## Workflow follow-up

- Ask the user for approval before the final commit (AGENTS.md).
- Archive the change after review with `/opsx:archive`.
