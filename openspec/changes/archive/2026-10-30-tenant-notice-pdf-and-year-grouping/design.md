# Design

## Context

See proposal.md for motivation. Current state:

- **PDF pattern.** `PdfDownloadButton` takes a `createPdf` callback. Callers import `@react-pdf/renderer` and a `*-pdf-document.tsx` dynamically inside that callback, as `DownloadChargesPdfButton` does. The shared building blocks live in `src/components/pdf/primitives.tsx`.
- **Notifications.** `NotificationsSidebar` is a server component. It receives `NotificationItem[]` from `buildDashboardNotifications`. Each item carries `hoaName` and `hoaHeader` but not the HOA `footer`, which is stored in the database and not used anywhere in the UI yet.
- **Charge lists.** The tenant charge lists already group by year. `ChargesDisplay` and `MultiChargesDisplay` use `groupByYearDesc`, `YearTrigger` and `useChargeListOpenState`, with the newest year open and its months closed. `AdminChargesList` is still a flat list of months.
- **Admin payments.** `AdminPaymentsList` opens the year that equals the `currentYear` prop.

## Goals / Non-Goals

**Goals:**

- Reuse the existing PDF primitives and the collapsible charge-list parts. No new dependencies.

**Non-Goals:**

- Server-side PDF rendering.

## Decisions

### 1. Notice PDF

- Add `footer: true` to the `homeownersAssociation` select in `findUserWithApartments`.
- Add `hoaFooter` to `NotificationItem` and to `buildDashboardNotifications`.
- Move `groupByApartment` out of `hoa-notification-card.tsx` into `src/components/dashboard/group-notifications.ts`, so the card and the PDF group the items the same way.
- New file `src/components/pdf/notice-pdf-document.tsx` renders `<Document>` with one `DocumentPage` per apartment group. Each page shows:
  - a `PdfHeader` with the title `Naliczenia bieżące – {apartment}` and the subtitle `{hoaName} | Wygenerowano: {date}`
  - the HOA header text, below the title
  - a table built from the existing `styles` with the columns `Opis`, `Ilość`, `Cena jedn.` and `Razem`
  - a `Razem` total row
  - the footer text, when there is one
- A new `PdfNoteText` primitive keeps the line breaks of the header and footer text.
- New file `src/components/pdf/download-notice-pdf-button.tsx` is a client component. It takes serialisable `NotificationItem[]` (the amounts are already strings) and renders a non-compact `PdfDownloadButton`. The download file name is `naliczenia-biezace-${YYYY-MM-DD}.pdf`.
- In `NotificationsSidebar`, the "Łączna kwota do zapłaty" box becomes `flex items-center justify-between`, with the button on the right.

Alternative considered: an API route that renders the PDF on the server. Rejected to stay consistent with the existing in-browser PDFs and with the spec's on-demand bundle loading requirement.

### 2. Year grouping in the admin lists

- `AdminChargesList` uses `groupByYearDesc(periods, getPeriodYear)`, `YearTrigger` and `useChargeListOpenState(newestYear, null)`. This mirrors `ChargesDisplay` without the active-month and scrolling logic.
- `AdminPaymentsList` opens `sorted[0]?.year`. The `currentYear` prop is then no longer used, so it is removed from `AdminPaymentsList`, from `ApartmentPaymentsSection` and from the admin apartment page.

## Risks / Trade-offs

- [Long HOA header text overflows the page] → `react-pdf` wraps the text and moves overflow to the next page automatically. Each apartment's content starts on a new page.
- [`AdminPaymentsList` drops the `currentYear` prop] → Small internal API change. The admin page tests are updated in the same task.
