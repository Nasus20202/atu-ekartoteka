# Proposal

## Why

Utility settlements, meter readings and annual cost settlements reach residents only as PDF printouts from the legacy accounting system. The application stores none of the meter data and cannot show a resident how a settlement result came about.

## What Changes

- Admins get a new section on `/admin/import` that imports utility settlement PDFs and annual cost settlement PDFs: upload, preview, confirm, result.
- A record is matched to an apartment and its owner (by external apartment ID when the file prints it, otherwise by street, building and flat number). There is no fuzzy matching; a name that differs only by a trailing annotation needs the admin's confirmation.
- Values are stored as printed. Utility types are not stored: lines are grouped by the code in their name when they are shown, so a new utility needs a code change only.
- Imports are cross-checked against stored charges and earlier settlements. Rounding differences follow the existing import pipeline: they are warnings and the file value is stored.
- Tenants get a new page `Rozliczenia` (`/dashboard/settlements`) with the views `Media`, `Liczniki` and `Koszty rzeczywiste`, linked from the navbar.
- Admins read the same views for any apartment on its admin page, with the full history.
- The database statistics, the row count metric and the Grafana dashboard include the settlement tables.
- The font library of the PDFs is patched, so a second download no longer loses letters.
- Every view offers a `Pobierz PDF` button, like the other pages, with a designed PDF of what it shows.
- The tenant history window also limits settlements for tenants.
- New tables for both settlement kinds and for meter readings. The migration is additive and is created only after the schema in `design.md` has been approved.

## Non-goals

- Editing or deleting stored settlements in the interface.
- Storing the uploaded PDF files or their footer notes.
- Layouts not covered by the available samples; such files are rejected.
- Re-running the settlement checks from the database validation action.

## Capabilities

### New Capabilities

- `utility-settlements`: importing utility and annual cost settlement PDFs with meter readings, checking them, and showing them to the apartment's tenant and to admins.

### Modified Capabilities

- `tenant-history-window`: the window also applies to settlements and meter readings.
- `page-titles`: the settlements page has a title.
- `pdf-export`: PDF documents for the settlement, meter and annual cost views.
- `tooling`: two more admin JSON API write routes.
- `visual-design`: the tenant navbar marks the current page.
- `observability`: the table row counts include the settlement tables.

## Impact

- Database: 6 new tables and 1 enum; two relation fields on `Apartment`, no column changes.
- Code: new slice `src/lib/settlements/`, components in `src/components/settlement-import/`, `src/components/settlements/` and `src/components/pdf/`, two API routes, the admin apartment page, the dashboard navbar.
- Dependencies: `pdfjs-dist` moves from development to runtime dependencies.
- Tests and docs: visual snapshots of the admin import page, the admin apartment page and the tenant navbar change, and new PDF baselines are added; `docs/importing-data.md` and `docs/architecture.md` are updated.
