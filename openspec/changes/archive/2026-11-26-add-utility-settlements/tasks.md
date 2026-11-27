# Tasks

Test fixtures use fictional names, flats and serial numbers. The real sample PDFs are never committed.

## 1. Data Model

- [x] 1.1 Get the user's explicit approval of the schema in `design.md` before creating or applying any migration; record the approval date here (approved 2026-11-26)
- [x] 1.2 Add the models to `prisma/schema.prisma` and create the migration `add_utility_settlements` on the local database; verify the SQL only creates new objects, `pnpm prisma migrate status` is clean and `pnpm exec tsc --noEmit` passes

## 2. PDF Reading

- [x] 2.1 Move `pdfjs-dist` to `dependencies`, add it to `serverExternalPackages`, and read positioned rows in `src/lib/settlements/parsers/`; verify with a test on a synthetic PDF with Polish characters
- [x] 2.2 Detect the document type from structure, ignoring title, file name and metadata; verify tests for both types, a missing annual title, an unknown document and an unreadable file

## 3. Parsers

- [x] 3.1 Parse utility pages (lines, kind from the column header, meter rows, summary rows, totals, signs) and reject unknown rows and headers; verify tests for zero lines, ignored footer and unknown content
- [x] 3.2 Assemble utility records by apartment, owner and period; verify tests for alternating one-service pages, repeated meter rows and conflicting meter rows
- [x] 3.3 Parse annual records, including items continuing on the next page and partial periods; verify tests for each

## 4. Rules And Checks

- [x] 4.1 Add grouping by code, unit and display names in `rules/`; verify tests for wording variants, no code and two codes
- [x] 4.2 Add owner and apartment matching with its candidate queries; verify tests for former owner, annotation-only difference, no match, two matches and a different mailing address
- [x] 4.3 Add consistency errors and rounding warnings; verify tests at 0.01 and 0.02, the coefficient, the owner total, billed against metered consumption and duplicate records across files
- [x] 4.4 Add the utility charge check with its query; verify tests for match, quantity and amount differences, December allocation exclusion and missing months
- [x] 4.5 Add the annual charge check with its query; verify tests for item amount, flat basis with advances, community tolerance, partial periods and missing allocations
- [x] 4.6 Add checks against stored settlements; verify tests for overlap, continuity, gaps, a serial on another apartment and owner validity

## 5. Import

- [x] 5.1 Add record keys, unchanged and changed detection, and the per-file transaction; verify tests for re-import, a new issue date, replace, missing confirmation and one failing file
- [x] 5.2 Add the preview and import use cases and the two API routes with `requireAdmin()`; verify route tests for 401, 403, no files, preview writing nothing and no personal data in logs
- [x] 5.3 Verify a clean text import keeps settlements with a test of the import transaction

## 6. Admin Import Section

- [x] 6.1 Add the `Rozliczenia (PDF)` section to `/admin/import` with preview, confirmations, import and results; verify component and hook tests, including the animated wrapper and an accessible name for every control
- [x] 6.2 Add grouped findings and the text download, reusing the existing components; verify their tests
- [x] 6.3 Add an E2E test with generated sample PDFs (preview, confirm, import, re-import, rejected file) and update the admin import visual snapshot; verify both pass
- [x] 6.4 Document the settlement import (files, order after charges, findings, confirmations) in `docs/importing-data.md`; verify each statement against the code

## 7. Tenant Reads

- [x] 7.1 Add tenant-scoped queries and DTOs with the history window and database aggregation; verify tests for a foreign apartment, a hidden period and the sums by kind and code

## 8. Tenant Page

- [x] 8.1 Add `/dashboard/settlements` with its title, skeleton, `Lokal` and `Okres` selects and empty states; verify page tests for redirect, not found and the title
- [x] 8.2 Build the `Media` view; verify component tests for banner wording, price change, `Pozostałe`, unknown code and missing meter
- [x] 8.3 Build the `Liczniki` view; verify tests for cards and readings of several periods
- [x] 8.4 Build the `Koszty rzeczywiste` view; verify tests for items and the `Suma` row
- [x] 8.5 Add the `Rozliczenia` link and the current-page marking to the tenant navbar; verify navbar tests for desktop and mobile
- [x] 8.6 Add E2E tests (tenant flow, history window, access to a foreign apartment) and visual snapshots of the page on desktop and phone in both themes, updating tenant navbar snapshots; verify they pass

## 9. Admin Apartment Page

- [x] 9.1 Add the admin settlement query without the history window; verify tests for full history, a former owner's record and an apartment without settlements
- [x] 9.2 Add the `Rozliczenia` card with the shared views and document details to the admin apartment page; verify page tests, including access by a non-admin, and update its visual snapshots

## 10. PDF Export

- [x] 10.1 Add the utility, meter and annual PDF documents; verify component tests for wording, expanded lines, repeated headings and Polish characters
- [x] 10.2 Add the `Pobierz PDF` button to the tenant page and the admin card for the active view; verify tests for the file names, no button without data and on-demand loading
- [x] 10.3 Add E2E downloads for tenant and admin and visual baselines for the three PDFs; verify they pass and review the rendered pages with the user

## 11. Integration

- [x] 11.1 Run a local, uncommitted check of all real sample files through the preview and compare every stored value of a local import with the printouts' totals; verify no errors other than expected confirmations (13 files, 192 records, 2026-11-26)
- [x] 11.2 Verify the standalone production build parses a PDF (worker included)
- [x] 11.3 Update `docs/architecture.md` for the new slice and verify it against the layout
- [x] 11.4 Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm exec prettier --check .`, `CI=1 pnpm test` with no stderr or stdout blocks, and `pnpm test:e2e`

## 12. Review Feedback

- [x] 12.1 Show document details to admins only, dropping the issue date and file name from the tenant query; verify query, view and PDF tests
- [x] 12.2 Hide the `Lokal` select when the tenant has one apartment; verify a component test
- [x] 12.3 Add the settlement counts to the database statistics, refreshed after a settlement import; verify query, card and hook tests and update the admin import snapshots
- [x] 12.4 Add the settlement tables to the row count metric and the Grafana dashboard; verify the unit test, the OpenTelemetry integration spec and that the dashboard loads

- [x] 12.5 Keep PDF section headings on the page with their first row; verify with a test over many page positions
- [x] 12.6 Patch `fontkit` so a later PDF keeps all letters, and copy `patches/` in the Docker builds; verify the regression test fails without the patch and both images build

## Workflow follow-up

- Ask for approval before committing.
- Add `openspec/specs/utility-settlements/spec.md` to the spec index in `openspec/config.yaml` when archiving.
- Verify and archive the change with the OpenSpec skills.
