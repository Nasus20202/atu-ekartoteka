## Why

Payment and charge data is currently readable but not quickly scannable: users must mentally compare monthly table rows to understand whether their saldo is improving, and admins have no fast way to spot long-term balance direction for a single apartment. Adding lightweight charts now improves the most important finance screens without replacing the existing tabular detail that users already rely on.

## What Changes

- Add `recharts` and introduce small chart components styled to match the existing shadcn/Tailwind UI.
- Add a monthly finance chart to the tenant payment details page that combines monthly `Wpłaty`, `Naliczenia`, and running `Saldo` for the selected year, favouring area-based visuals over bar-heavy charts.
- Add a compact dashboard chart to the tenant charges summary card showing HOA-split `Naliczenia` history with a 12-month viewport that can be shifted backward and forward.
- Add per-year monthly finance charts to the admin apartment detail page so each stored payment year can be scanned month by month, using the same area-chart language as the tenant detail view.
- Keep the existing cards, totals, and tables as the authoritative detailed view; the charts are a visual summary layer, not a replacement.

## Capabilities

### New Capabilities

_None._ All changes extend existing capabilities.

### Modified Capabilities

- `charges-and-payments`: tenant payment detail and dashboard charges summary gain chart-based summaries of existing financial data.
- `apartment-management`: admin apartment detail gains a historical balance chart for the apartment's payment history.
- `visual-design`: the UI system gains requirements for responsive, accessible chart presentation that matches existing semantic styling.

## Impact

**Code:**

- `package.json` and lockfile: add `recharts`.
- `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`: add the monthly combo chart above or near the payment table.
- `src/app/dashboard/page.tsx` and `src/components/dashboard/charges-summary-card.tsx`: prepare trailing 12-month charge trend data split by HOA and render a compact chart.
- `src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx`: add per-year monthly finance charts inside the payment history UI.
- New chart-focused UI components/helpers under `src/components/` and/or `src/lib/` for transforming payment/charge records into chart-ready data.
- Tests: component tests for chart rendering/data mapping and E2E coverage for the affected user flows.

**Dependencies:**

- Add `recharts`.

**Non-goals:**

- Building a generic analytics dashboard or cross-HOA reporting module.
- Removing or replacing the existing payment/charge tables and summary cards.
- Adding server-side chart image export, PDF chart rendering, or printable chart output.
- Introducing real-time/live-updating charts.
