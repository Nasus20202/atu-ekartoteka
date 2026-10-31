# Tasks

## 1. Cutoff helper

- [x] 1.1 Add `getChargeCutoffPeriod(payments, now)` and a max-across-apartments variant with unit tests (null without payments, cap at current month, latest non-zero charge month); run `pnpm vitest --run` on the new tests
- [x] 1.2 Extend the charges queries to select the latest charged payment year's monthly charge fields in Prisma and verify with a query test

## 2. Tenant views

- [x] 2.1 Anchor `getDashboardPeriods`, trend, balances and tiles on the cutoff with current-month fallback; update dashboard-data tests
- [x] 2.2 Replace `chargesDataDate` with `cutoffPeriod` in `ChargesDisplay`, `MultiChargesDisplay`, both charges pages, `PaymentTable` and the payment page; update component tests and delete `isPeriodAfterDate`/`getCommonChargesDataDate` if unused
- [x] 2.3 Add an e2e test that the dashboard newest month equals the charges list newest month with data after the WMB date; run `pnpm playwright test` for it

## 3. Tooltip readability

- [x] 3.1 Set foreground `color`, `itemStyle` and `labelStyle` in `chart-styles.ts`; extend `chart-styles.test.ts` and visually check the balance chart tooltip in dark mode

## 4. Wrap-up

- [x] 4.1 Run lint, prettier and the full vitest suite; verify all pass
