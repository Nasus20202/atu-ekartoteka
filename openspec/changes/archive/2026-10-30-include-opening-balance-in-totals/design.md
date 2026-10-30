# Design

## Context

The web payment table (`src/components/payments/payment-table.tsx`) and the payment PDF (`src/components/pdf/payment-pdf-document.tsx`) each build their own `totalPayments` / `totalCharges` with the same code: `sumDecimals` over `PAYMENT_MONTH_FIELD_KEYS` / `CHARGE_MONTH_FIELD_KEYS`. The footer `Saldo` in both is the stored `closingBalance`.

Data guarantees relied on:

- `openingBalance` is not read from the file. The WPLATY parser derives it as `openingSurplus − openingDebt`.
- `closingBalance` is read from the file. The import (`validateWplaty`, `data-import` "Payment Import Validation") aborts the HOA import unless `closingBalance = openingBalance + Σpayments − Σcharges` within ±0.01.
- I checked every `wplaty.txt` in the real data set (20 files, 286 rows). All satisfy the identity within ±0.01.

Together these mean that for every stored `Payment`, `(openingSurplus + Σpayments) − (openingDebt + Σcharges) = closingBalance` within ±0.01.

## Goals / Non-Goals

**Goals:**

- One shared helper computes the `Razem` totals, so the web table and the PDF cannot drift apart.
- The footer arithmetic visibly adds up for tenants.

**Non-Goals:**

- New import validation. The existing closing-balance check already enforces the identity.
- API, DTO, Prisma schema or migration changes. `openingSurplus` and `openingDebt` are already on `PaymentDtoSource`.

## Decisions

### Shared totals helper in `src/lib/utils/payment-months.ts`

Add a helper next to the existing `PAYMENT_MONTH_FIELD_KEYS` / `CHARGE_MONTH_FIELD_KEYS`. It returns both the year-only sums and the `Razem` sums:

```ts
getPaymentTotals(payment) => {
  yearPayments: Decimal; // Σ 12 monthly payments
  yearCharges: Decimal;  // Σ 12 monthly charges
  totalPayments: Decimal; // openingSurplus + yearPayments
  totalCharges: Decimal;  // openingDebt + yearCharges
}
```

- The web table uses `totalPayments` / `totalCharges` in the footer.
- The PDF uses `totalPayments` / `totalCharges` in the `Razem` row and `yearPayments` / `yearCharges` in the summary tiles. This keeps the tiles unchanged.
- Rationale: it removes the duplicated summing from both components, which are near the 200-line limit (181 and 188 lines). The module already owns the month-field knowledge.
- Alternative considered: inline `openingSurplus.plus(...)` in each component. Rejected because it duplicates the rule in two places.

### Footer `Saldo` stays the stored `closingBalance`

- Rationale: the closing balance is the value from the source system and is used elsewhere (dashboard summaries, cross-year validation). Showing a different derived number only in the footer could disagree with those views.
- Alternative considered: footer `Saldo = totalPayments − totalCharges`, which always matches exactly. Rejected for the reason above. Any difference is bounded by the import tolerance of 0.01.

## Risks / Trade-offs

- [The footer can differ from `Wpłaty − Naliczenia` by up to 0.01 zł for a file at the tolerance edge] → The import already bounds this. It was not observed in real data.
- [Tenants see different `Razem` numbers than before for years with an opening balance] → Intended. It is display-only and flagged as BREAKING in the proposal.
- [Existing unit tests assert the old 12-month sums in the footer] → Update `payment-table.test.tsx` and `payment-pdf-document.test.tsx`. Add a case with non-zero `openingSurplus` / `openingDebt`.

## Migration Plan

None. This is a pure rendering change: deploy as usual, and roll back by reverting the commit.
