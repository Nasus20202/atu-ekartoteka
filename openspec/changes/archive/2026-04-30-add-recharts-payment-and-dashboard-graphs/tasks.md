## 1. Chart Foundation

- [x] 1.1 Add `recharts` to `package.json` and install/update the lockfile; verify the dependency resolves in the existing Next.js build setup.
- [x] 1.2 Create shared chart-data helpers for payments and charges that transform existing `Payment`/`Charge` records into serializable arrays for charts, and add unit tests covering month ordering, running balance calculation, trailing-12-month HOA trend shaping, and empty-series handling.

## 2. Tenant Payment Details Chart

- [x] 2.1 Create a client chart component for the payment details page that renders monthly `Wpłaty` and `Naliczenia` as areas plus running `Saldo` as a line, with Polish legend/tooltip text and currency formatting; add a component test covering rendered series labels/tooltips or the empty-state fallback.
- [x] 2.2 Update `src/app/dashboard/payments/[apartmentId]/[year]/page.tsx` to prepare chart data from the existing payment record and render the new chart without removing the current summary tiles, PDF action, or payment table; extend the page/component tests to cover the integrated chart state.

## 3. Tenant Dashboard Trend Chart

- [x] 3.1 Create a compact dashboard chart component for HOA-split `Naliczenia` history with a soft filled style, a default 12-month viewport, and a fallback message when no HOA series is available; add a component test covering trend, fallback, and history navigation states.
- [x] 3.2 Update `src/app/dashboard/page.tsx` and `src/components/dashboard/charges-summary-card.tsx` to derive HOA charge trend history from the already-loaded apartment charges and render the mini chart inside the existing charges summary card; extend tests for the dashboard/charges summary flow.

## 4. Admin Apartment Payment Charts

- [x] 4.1 Reuse the monthly finance area chart for the admin apartment detail page so each yearly payment section renders monthly `Wpłaty`, `Naliczenia`, and running `Saldo`, including the existing empty-state fallback.
- [x] 4.2 Update `src/app/admin/apartments/[hoaId]/[apartmentId]/page.tsx` and the payment history UI to render monthly charts inside each yearly section without changing the API contract; extend page tests around the payment-history section.

## 5. Verification

- [x] 5.1 Add or extend Playwright coverage for the tenant payment detail page, tenant dashboard, and admin apartment detail page so each flow asserts the new chart section is visible when data exists.
- [x] 5.2 Run `pnpm lint`, `pnpm test --run`, and the relevant Playwright specs for the affected dashboard/admin flows; fix regressions before implementation review.
