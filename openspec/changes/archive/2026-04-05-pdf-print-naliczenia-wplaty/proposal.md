## Why

Both tenants and admins currently have no way to export or print charges and payment history. Providing a PDF download option allows tenants to keep offline records or share summaries with their bank, and allows admins to produce printable documentation for any apartment directly from the apartment detail page.

## What Changes

- Add a "Drukuj / Pobierz PDF" button to the tenant per-apartment charge detail page (`/dashboard/charges/[apartmentId]`).
- Add a "Drukuj / Pobierz PDF" button to the tenant per-apartment payment detail page (`/dashboard/payments/[apartmentId]/[year]`).
- Add a "Drukuj / Pobierz PDF" button to the "Naliczenia" card on the admin apartment detail page (`/admin/apartments/[hoaId]/[apartmentId]`).
- Add a "Drukuj / Pobierz PDF" button to each payment year section in the "Historia wpłat" card on the same admin page.
- Each button generates and downloads a PDF that mirrors the on-screen content: HOA/apartment header, charge line items grouped by billing period (for naliczenia), or the summary card + monthly payment table (for wpłaty).
- PDF generation runs entirely in the browser (no server round-trip) using `@react-pdf/renderer`.

## Capabilities

### New Capabilities

- `pdf-export`: Client-side PDF generation and download for per-apartment charge and payment views — for both tenants and admins. Covers the PDF document structure, download trigger, and button placement in the existing pages.

### Modified Capabilities

- `charges-and-payments`: Add PDF export action to per-apartment charge and payment detail views for tenants (new user-facing capability within existing pages).
- `apartment-management`: Add PDF export actions to the admin apartment detail page — one in the Naliczenia card and one per payment year in the Historia wpłat card.

## Impact

- New dependency: `@react-pdf/renderer` (client-side only, no server impact).
- Modified pages: `src/app/dashboard/charges/[apartmentId]/page.tsx`, `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`, `src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx`.
- New components: PDF document components for charges and payments (in `src/components/pdf/`).
- No database schema changes.
- No API changes.
- No breaking changes to existing behavior.

## Non-goals

- PDF export for the overview (multi-apartment) charge page — only the per-apartment detail page is in scope.
- Server-side PDF generation or email delivery of PDFs.
- Print CSS / `window.print()` approach (browser print dialog is not in scope; proper PDF download is preferred).
