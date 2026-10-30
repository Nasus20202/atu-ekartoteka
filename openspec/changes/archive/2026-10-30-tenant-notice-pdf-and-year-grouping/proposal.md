# Proposal

## Why

The client asked for two panel improvements:

- **Printing the current charge notice.** Tenants can read "Bieżące naliczenia czynszowe" only on screen. They want to print it with the HOA header, the way the paper notice looks.
- **Inconsistent history grouping.** The admin charge list is a flat list of months. The admin payment list opens the calendar year even when that year has no data.

## What Changes

- **Current-notice PDF.** A "Pobierz PDF" button is added on the right of the "Łączna kwota do zapłaty" box in the dashboard "Powiadomienia" card. The PDF has one A4 page per apartment, and each page contains:
  - the HOA header text
  - the apartment
  - the notice line items and their total
  - the HOA footer, when there is one
- **Year-collapsed admin history.**
  - The admin charge list is grouped into collapsible year sections.
  - In the admin charge and payment lists, the newest year with data starts open and older years start closed. Tenant charge views already behave this way.

## Non-goals

- Changing the existing per-month charge PDF or the payment-year PDF.
- Restructuring the tenant `/dashboard/payments` list.
- Labelling the dashboard "Wpłaty" button with a year. The payment detail page already has a year selector.
- Limiting which years tenants see. That is handled by the separate change `tenant-history-window`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pdf-export`: a new PDF of the current charge notice, with the HOA header and one page per apartment.
- `charges-and-payments`: the admin charge list is grouped by year and the admin payment list opens the newest year.

## Impact

- **Data:** `findUserWithApartments` also selects the HOA `footer`. There is no DB migration.
- **UI:**
  - `NotificationsSidebar`, `HoaNotificationCard` (grouping is extracted from it)
  - `AdminChargesList`, `AdminPaymentsList`, `ApartmentPaymentsSection`
  - new `notice-pdf-document.tsx` and `download-notice-pdf-button.tsx`
- **Tests:**
  - Unit tests for notification grouping, the PDF document, the button and the admin lists.
  - E2E tests for the notice PDF download and the admin year sections.
