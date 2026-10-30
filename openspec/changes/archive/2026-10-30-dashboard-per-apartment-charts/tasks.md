# Tasks

## 1. Chart foundations

- [x] 1.1 Extract `useChartViewport` / `ChartViewportNav` and `createYAxisTick` (bold zero tick); add zero reference lines and `zł` compact Y-axis labels to dashboard charts and a zero line to the payment-year chart
- [x] 1.2 Add `chart-links.ts` with charges-month and payment-year links; verify with `chart-links.test.ts`

## 2. Balance history

- [x] 2.1 Add `getBalanceHistory` and `mergeBalanceHistories`; verify opening balances, carry-forward, multi-year and merge cases in `balance-history-data.test.ts`
- [x] 2.2 Add `BalanceHistoryChart` (sign colours for one apartment, per-apartment colours and legend for several, clickable bars); verify in `balance-history-chart.test.tsx`
- [x] 2.3 Load all payment years in `findUserWithApartments`; add `buildApartmentBalances` and render per-apartment rows, total and one chart in `PaymentsSummaryCard`

## 3. Charge trend per apartment

- [x] 3.1 Group `getChargeTrendByApartmentHistory` per apartment in apartment order with `apartmentId` on each series; make chart months clickable
- [x] 3.2 Link recent month tiles to `/dashboard/charges?month=`; support `activeMonth` on the combined charges page

## 4. Charges pages and payment years

- [x] 4.1 Expand only the newest year and collapse months by default on both charges pages; keep requested months opened and scrolled below the sticky header; verify in the charges display tests
- [x] 4.2 Add `findApartmentPaymentYears` and `PaymentYearSelect` to the payment detail header; verify in `find-apartment-payment-years.test.ts` and `payment-year-select.test.tsx`

## 5. Integration checks

- [x] 5.1 Run lint, typecheck and the full unit test suite
- [x] 5.2 Update dashboard E2E tests for the balance chart and the new links
- [ ] 5.3 Run the dashboard E2E tests and refresh visual regression screenshots
