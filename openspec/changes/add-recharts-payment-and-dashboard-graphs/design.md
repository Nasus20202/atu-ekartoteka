## Context

The target screens already expose the underlying financial data but only as cards and tables:

- Tenant payment detail (`src/app/dashboard/payments/[apartmentId]/[year]/page.tsx`) loads one `Payment` record for a specific apartment and year, computes yearly totals, and renders the monthly `PaymentTable`.
- Tenant dashboard (`src/app/dashboard/page.tsx`) already loads all assigned apartments with charges and the latest payment per apartment via `findUserWithApartmentsCached`, then computes current and previous month charge totals for `ChargesSummaryCard`.
- Admin apartment detail (`src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx`) fetches apartment details from `/api/admin/apartments/[apartmentId]`, including the full `payments` array, and renders yearly payment sections in `AdminPaymentsList`.

The graph work crosses multiple modules and introduces a new UI dependency, so a design artifact is warranted even though the data already exists. The main constraints are: keep files under 200 lines, preserve the current shadcn/Tailwind visual language, avoid creating new reporting endpoints unless necessary, and ensure charts remain usable on mobile.

## Goals / Non-Goals

**Goals:**

- Add a reusable chart layer based on `recharts` for the three identified finance views.
- Keep all existing payment/charge tables and summary totals intact, with charts acting as a quick visual summary only.
- Reuse existing query/API payloads where possible so implementation stays local to the current screens.
- Make the charts responsive, accessible, and semantically styled for positive/negative finance values.
- Keep chart data transformation deterministic and covered by unit tests.

**Non-Goals:**

- Adding a generic analytics/reporting subsystem or cross-page chart framework.
- Changing database schema, Prisma models, or import pipelines.
- Adding new API endpoints or changing existing API response contracts for this feature.
- Rendering charts into PDFs or email templates.
- Introducing client-side caching/state libraries for chart data.

## Decisions

### Decision 1 - Use `recharts` with small client-only chart components

`recharts` is the best fit for the current stack because it pairs naturally with React component composition and the shadcn/Tailwind styling model. Each chart will live in its own small client component and receive already-shaped serializable data from its parent screen.

**Rationale:**

- The requested charts are standard business visuals: overlapping area charts with a balance line for monthly finance views, plus a compact trend area chart for dashboard history.
- The app does not need advanced zooming, dense datasets, or a full charting engine.
- Keeping chart rendering isolated in client components avoids pushing presentation logic into large page files.

**Alternatives considered:**

- `echarts`: rejected as heavier and unnecessary for the planned scope.
- Hand-rolled SVG charts: rejected because axis, tooltip, and responsive behavior would take longer to build and test than the feature warrants.

### Decision 2 - Derive all chart datasets from existing screen data

No new endpoint is required. Each screen already loads enough data for its chart:

- **Tenant payment detail:** derive 12-or-fewer month points from the `Payment` record using the same monthly values already shown in `PaymentTable`.
- **Tenant dashboard mini trend:** aggregate `Charge.totalAmount` across all available monthly `period` values in `userData.apartments`, grouped by HOA, then show a client-side 12-month viewport that can be shifted through history.
- **Admin apartment detail monthly charts:** derive month-level `Wpłaty`, `Naliczenia`, and running `Saldo` from each stored payment year in the existing `apartment.payments` response.

**Exact request/response shape impact:**

- `/dashboard/payments/[apartmentId]/[year]`: no API boundary; the server page passes chart props like `Array<{ label: string; payments: number; charges: number; balance: number }>` to a client chart component.
- `/dashboard`: no API boundary; the server page passes the full `Array<{ period: string; label: string; [hoaKey: string]: number }>` history plus HOA series metadata to a client mini trend component that manages the visible 12-month window.
- `GET /api/admin/apartments/[apartmentId]`: response shape stays unchanged. Each yearly section derives `Array<{ label: string; payments: number; charges: number; balance: number }>` from the returned payment record.

**Alternatives considered:**

- Add precomputed chart data to `/api/admin/apartments/[apartmentId]`: rejected because it duplicates derivation logic and expands the API contract for a presentation-only concern.
- Add a shared finance reporting endpoint: rejected because the data volumes are small and only three screens need chart summaries.

### Decision 3 - Centralize chart data shaping in small finance helpers

Create shared helpers for transforming domain records into chart-friendly arrays, for example under `src/lib/charts/finance.ts` or `src/lib/payments/chart-data.ts`. The helpers should emit plain serializable numbers/strings rather than `Decimal` instances.

Representative helpers:

- `getPaymentMonthlyChartData(payment)` -> monthly points with `label`, `payments`, `charges`, `balance`
- `getChargeTrendByHoaHistory(apartments)` -> full monthly period totals grouped by HOA
- `getPaymentMonthlyChartData(payment)` reused for both tenant payment detail and admin yearly payment sections

**Rationale:**

- Reuses business logic between screen components and unit tests.
- Keeps page files and chart components below the repository's size target.
- Avoids repeating `Decimal` conversion/formatting rules in each chart component.

**Alternatives considered:**

- Compute chart data inline in each page/component: rejected because the same sorting/labeling logic becomes harder to test and maintain.

### Decision 4 - Use area charts as the default visual language for financial trends

The new financial charts should prefer area-based visuals over bars wherever the
goal is to show flow and trend across time:

- Payment detail chart: stacked or overlapping areas for `Wpłaty` and
  `Naliczenia`, plus a distinct line for running `Saldo`.
- Dashboard mini trend: a soft-filled multi-series area chart split by HOA.
- Admin payment history: the same monthly area + balance-line chart reused per
  payment year.

**Rationale:**

- The user explicitly prefers area charts.
- The datasets are chronological and relatively sparse, so continuous filled
  shapes communicate trend direction better than separated columns.
- Reusing the same visual language across tenant and admin payment views lowers
  cognitive load.

**Alternatives considered:**

- Bar + line combo for monthly payment detail: rejected in favor of a more
  consistent area-chart treatment across all three surfaces.

### Decision 5 - Keep charts visually secondary to existing finance summaries

Charts should live inside existing cards, above or beside the detailed content,
and use muted styling with semantic emphasis for the key series:

- Payment detail chart: filled areas for `Wpłaty` and `Naliczenia`, line for
  `Saldo`.
- Dashboard mini trend: a small soft-filled line chart under the existing current/previous period summaries instead of replacing them, with controls to shift the 12-month window.
- Admin payment history: each yearly payment section gets its own monthly area
  chart above the monthly table.

Tooltips, legends, and labels stay in Polish. Positive/negative values keep the app's existing green/red semantic treatment where practical, while neutral chart chrome uses semantic tokens (`text-muted-foreground`, `border-border`, etc.).

**Rationale:**

- Users already rely on the numeric summaries and tables as the source of truth.
- The charts should help with scanning, not force users to decode the interface.

**Alternatives considered:**

- Replace tables/cards with charts-first layouts: rejected because it would materially change existing behavior and add usability risk.

### Decision 6 - Handle responsiveness and accessibility explicitly

All charts will render inside responsive containers with conservative heights and fallbacks for sparse datasets. Each chart component should include:

- a visible section title/description in Polish,
- a text summary or `sr-only` description describing what the chart shows,
- tooltip values formatted with the existing currency helpers,
- mobile-safe dimensions so the page body never scrolls horizontally.

For datasets with fewer than two meaningful points, the component may either render a simplified chart or fall back to a short explanatory message rather than a visually broken plot.

**Rationale:**

- This aligns with the repo's visual-design and accessibility requirements.
- Finance charts with a single point often mislead more than they help.

**Alternatives considered:**

- Always render regardless of dataset size: rejected because single-point charts on the admin yearly trend and dashboard trend add noise.

## Risks / Trade-offs

- [Chart bundle size increase from `recharts`] -> Mitigation: use one library only, keep charts scoped to three views, and avoid large custom wrappers.
- [Negative/positive financial semantics may be unclear in multiseries charts] -> Mitigation: preserve Polish legends/tooltips and keep the running `Saldo` series visually distinct from `Wpłaty`/`Naliczenia`.
- [Dashboard chart may be noisy for users assigned to many HOAs] -> Mitigation: keep the chart limited to the trailing 12 months and use stable HOA legend labels/colors.
- [Admin page is already large] -> Mitigation: reuse the existing monthly payment chart component inside yearly sections instead of adding another top-level chart block.
- [Decimal-to-number conversion for charts can lose precision beyond display needs] -> Mitigation: only convert at the chart-data boundary, after business totals are computed; charts are visual summaries and display values still use `formatCurrency` in tooltips/labels.

## Migration Plan

1. Add `recharts` to project dependencies.
2. Create chart-data helpers that transform existing `Payment` and `Charge` records into serializable arrays.
3. Add the tenant payment details monthly combo chart and test its data mapping.
4. Add the dashboard mini charge trend split by HOA for the trailing 12 months using existing dashboard query data.
5. Add admin per-year monthly charts using the existing apartment detail response.
6. Run lint, unit tests, and relevant E2E coverage.

Rollback is straightforward: remove the chart components/helpers and the `recharts` dependency. No database or API migration is involved.

## Open Questions

None. The chart locations, library choice (`recharts`), 12-month dashboard range, HOA split, and admin per-month scope are settled.
