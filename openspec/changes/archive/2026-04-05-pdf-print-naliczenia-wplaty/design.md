## Context

Tenants can view per-apartment charge detail (`/dashboard/charges/[apartmentId]`) and per-apartment payment detail (`/dashboard/payments/[apartmentId]/[year]`). Both pages are `'use client'` components that fetch data via `fetch()` and render it using existing shadcn/ui-based components (`PeriodCard`, `PaymentTable`, summary cards).

Admins view the same data inline on `/admin/apartments/[hoaId]/[apartmentId]` — a single `'use client'` page with four cards: "Naliczenia" (charges grouped by period), "Historia wpłat" (one section per payment year using the shared `PaymentTable`), "Powiadomienia czynszowe", and apartment info. This page fetches all data in one call to `GET /api/admin/apartments/[apartmentId]`.

There is currently no mechanism for either role to export or print this data. The addition requires a PDF generation strategy that fits the client-side-only, App Router architecture.

## Goals / Non-Goals

**Goals:**

- Provide a "Drukuj / Pobierz PDF" button on the tenant per-apartment charge detail page.
- Provide a "Drukuj / Pobierz PDF" button on the tenant per-apartment payment detail page.
- Provide a "Drukuj / Pobierz PDF" button in the "Naliczenia" card on the admin apartment detail page.
- Provide a "Drukuj / Pobierz PDF" button per payment year in the "Historia wpłat" card on the admin apartment detail page.
- PDFs faithfully reproduce the on-screen information in a readable, printable layout.
- Generation and download happen entirely in the browser without a new API endpoint.

**Non-Goals:**

- Multi-apartment overview PDF.
- Server-side rendering of PDFs.
- Email delivery of generated PDFs.
- Print CSS / `window.print()` approach.

## Decisions

### Decision 1: `@react-pdf/renderer` over `jsPDF` or `html2pdf.js`

`@react-pdf/renderer` allows defining PDF documents using React components, which keeps the document structure co-located with the existing component model and produces a proper, deterministic PDF (not a screenshot). `jsPDF` requires manual coordinate-based drawing; `html2pdf.js` screenshots the DOM and produces blurry or layout-sensitive output. `@react-pdf/renderer` is the standard choice for React apps needing structured PDFs.

Because `@react-pdf/renderer` bundles a font system and PDF encoder (~600 kB gzipped), it must be imported only on the client side (dynamic import with `ssr: false` in Next.js is not needed since the pages are already `'use client'`). The bundle cost is acceptable given these are detail pages with low traffic and no SSR impact.

### Decision 2: Lazy dynamic import to keep initial bundle small

Both detail pages already load their data before rendering. The PDF document components will be imported lazily via `React.lazy` + `Suspense` or via a `onClick` handler that dynamically imports the renderer and triggers `pdf(...).download(...)`. The `onClick` approach (import-on-demand) is preferred: the large `@react-pdf/renderer` bundle is only fetched when the user clicks the button, keeping initial page load unchanged.

Pattern:

```ts
async function handleDownload() {
  const { pdf } = await import('@react-pdf/renderer');
  const { ChargePdfDocument } = await import('@/components/pdf/charge-pdf-document');
  const blob = await pdf(<ChargePdfDocument ... />).toBlob();
  // trigger browser download
}
```

### Decision 3: Reusable PDF primitive components in `src/components/pdf/`

Two top-level PDF document components are created:

- `src/components/pdf/charge-pdf-document.tsx` — renders the charges PDF (header + period sections + line item table).
- `src/components/pdf/payment-pdf-document.tsx` — renders the payments PDF (header + summary section + monthly table).

Shared primitive wrappers (styled `View`, `Text`, `Page`) go in `src/components/pdf/primitives.tsx` to avoid duplication and keep individual document files under 200 lines.

### Decision 4: Download filename convention

Filenames are derived from available data at click time:

- Charges: `naliczenia-{apartmentAddress}-{date}.pdf`
- Payments: `wplaty-{apartmentAddress}-{year}.pdf`

Date is formatted as `YYYY-MM-DD` (ISO, locale-neutral).

### Decision 5: No new API endpoint

The pages already receive all necessary data through their existing fetch calls. The PDF components receive data as props. No additional server round-trip is required.

### Decision 6: Polish-friendly font

`@react-pdf/renderer` defaults to Helvetica, which lacks Polish diacritics (ą, ę, ś, etc.). A subset of the open-source **Roboto** font (Latin + Latin-Extended) will be registered once at module level in a shared `src/lib/pdf/register-fonts.ts` file. Roboto is already widely used and its woff/ttf assets are available via npm (`@fontsource/roboto`) or bundled directly in `public/fonts/`.

## Risks / Trade-offs

- **Bundle size** → `@react-pdf/renderer` adds ~600 kB gzipped. Mitigation: import-on-demand (Decision 2) ensures this is only loaded when the user clicks the button. The initial page load is unaffected.
- **Font loading** → Polish characters require a registered TTF font; missing glyphs render as boxes. Mitigation: Decision 6 — embed Roboto subset; add a test PDF with diacritics to E2E suite.
- **Layout differences** → PDF layout uses `react-pdf`'s flexbox subset, not Tailwind/CSS. PDF documents must be styled independently. Mitigation: keep PDF components separate from UI components; keep them simple (text + tables, no complex nested flex).
- **`@react-pdf/renderer` + React 19** → the library targets React 17/18; React 19 introduces minor breaking changes. Mitigation: verify compatibility on install; the library's peer dep range generally accepts React ≥17. If incompatible, pin a compatible version or use `--legacy-peer-deps`.
