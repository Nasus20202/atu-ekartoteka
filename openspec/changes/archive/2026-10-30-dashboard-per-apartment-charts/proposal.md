# Proposal

## Why

The tenant dashboard shows only the current closing balance per HOA and a charge trend split by HOA. Tenants with several apartments cannot see how each apartment's balance changed over time, the charts give no visual cue where zero is, and nothing on the dashboard leads straight to the matching charges or payment year.

## What Changes

- The `Saldo wpłat` card lists one row per apartment (address, HOA name, latest closing balance) instead of one row per HOA, with `Łącznie` shown only for more than one apartment.
- The `Saldo wpłat` card gains one monthly balance bar chart. For a single apartment the bars are green at or above zero and red below zero. For several apartments each apartment is its own series with its own colour and a legend.
- The dashboard charge trend chart is split per apartment instead of per HOA, and its series follow the apartments' order so colours match the balance chart.
- Both dashboard charts show a zero reference line, a bold `0` tick on the Y axis, compact amounts with the `zł` unit, the 12-month window with history navigation, and animations.
- The admin and tenant payment-year chart shows a zero reference line and a bold `0` tick.
- Clicking a charge trend month opens that month's charges; clicking a balance bar opens that apartment's payment year.
- The two recent month tiles in the charges card link to the charges page with that month opened. The combined charges page supports `?month=`.
- Apartment balance rows link to the apartment's latest payment year.
- Charges pages expand only the newest year and keep months collapsed by default; a requested month is expanded and scrolled into view below the sticky header (`scroll-padding-top`).
- The payment detail page header gets a `Rok` select to switch between the apartment's stored payment years.
- **BREAKING** (display only): the dashboard no longer groups balances or the charge trend by HOA, and charges pages no longer open every year and the newest month by default.

## Non-goals

- Changing how payments or charges are imported or stored.
- Changing the payment detail table, summary tiles or PDF.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `charges-and-payments`: the HOA-split "Dashboard Charge Trend Chart" requirement is replaced by a per-apartment, clickable charge trend; the per-HOA dashboard payments summary is replaced by per-apartment balances with a monthly balance chart and links; charges pages change their default expansion and the combined page accepts an active month; the payment detail page gains a year switcher.
- `visual-design`: financial charts show a zero baseline, a bold zero tick and currency units.

## Impact

- `src/app/dashboard/page.tsx`, `src/app/dashboard/dashboard-data.ts`, `src/lib/queries/users/find-user-with-apartments.ts` (loads every payment year).
- `src/components/dashboard/payments-summary-card.tsx`, `src/components/dashboard/charges-summary-card.tsx`.
- `src/components/charts/*`: new balance history data and chart, shared viewport, tick and link helpers; charge trend grouped per apartment.
- `src/app/dashboard/charges/page.tsx`, `src/components/charges/multi-charges-display.tsx`, `src/components/charges/charges-display.tsx` (active month, default expansion), `src/app/globals.css` (scroll padding).
- `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`, `src/components/payments/payment-year-select.tsx`, `src/lib/queries/apartments/find-apartment-payment-years.ts` (year switcher).
- Unit tests for the above and dashboard E2E tests. Visual regression screenshots of the dashboard need refreshing.
