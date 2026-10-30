# Tasks

## 1. Shared totals helper

- [x] 1.1 Add `getPaymentTotals(payment)` to `src/lib/utils/payment-months.ts`, returning `yearPayments`, `yearCharges`, `totalPayments` (`openingSurplus + yearPayments`) and `totalCharges` (`openingDebt + yearCharges`); verify with new cases in `src/lib/utils/__tests__/payment-months.test.ts` covering zero opening values, non-zero `openingSurplus`, non-zero `openingDebt`, and `totalPayments − totalCharges = closingBalance` for a consistent record

## 2. Web payment table

- [x] 2.1 Use `getPaymentTotals` in `src/components/payments/payment-table.tsx` so the `Razem` row shows `totalPayments` / `totalCharges` (footer `Saldo` stays `closingBalance`), removing the inline `sumDecimals` calls; verify `src/components/payments/__tests__/payment-table.test.tsx` is updated for the new totals and has cases for non-zero opening surplus/debt and an all-zero-months year whose `Razem` shows the `Bilans otwarcia` values

## 3. Payment PDF

- [x] 3.1 Use `getPaymentTotals` in `src/components/pdf/payment-pdf-document.tsx`: `Razem` row shows `totalPayments` / `totalCharges`, summary tiles `Naliczenia` / `Suma wpłat` show `yearCharges` / `yearPayments`; verify `src/components/pdf/__tests__/payment-pdf-document.test.tsx` asserts both the new `Razem` values and the unchanged tile values for a record with non-zero opening values

## 4. Integration checks

- [x] 4.1 Run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test --run`; verify all pass and the touched files stay under 200 lines
- [x] 4.2 Open a tenant payment detail page with a non-zero opening balance in the running app and the downloaded PDF; verify `Wpłaty razem − Naliczenia razem` equals the `Razem` `Saldo`

## Workflow follow-up

- Ask for approval, then commit (`fix(payments): include opening balance in Razem totals`).
- Archive the change with `/opsx:archive` after review.
