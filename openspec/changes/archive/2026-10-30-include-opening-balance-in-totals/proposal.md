# Proposal

## Why

The `Razem` footer in the payment table sums only the twelve monthly columns, while its `Saldo` cell shows the closing balance, which already includes the opening balance. As a result `Wpłaty razem − Naliczenia razem ≠ Saldo` (e.g. 7270,00 − 8189,41 = −919,41 zł, but the footer shows −838,76 zł), which confuses tenants reading the table.

## What Changes

- The `Razem` row's `Wpłaty` total includes the `Bilans otwarcia` wpłaty value (`openingSurplus`) on top of the twelve monthly payments.
- The `Razem` row's `Naliczenia` total includes the `Bilans otwarcia` naliczenia value (`openingDebt`) on top of the twelve monthly charges.
- As a result, `Wpłaty razem − Naliczenia razem` equals the `Saldo` shown in the `Razem` row.
- The same rule applies to the `Razem` row in the tenant payment table and in the payment PDF.
- **BREAKING** (display only): the `Razem` amounts shown to tenants change for any year with a non-zero opening balance.

## Non-goals

- Changing the "Podsumowanie roku" summary tiles (`Naliczenia`, `Suma wpłat`). They show the opening balance as its own tile, so they keep showing year-only sums.
- Changing how `openingBalance`, `closingBalance`, `openingDebt` or `openingSurplus` are imported or stored.
- Changing the running per-month `Saldo` values.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `charges-and-payments`: the "Skip Empty Months in Monthly Listings" requirement currently says `Razem` totals are the sum of the 12 monthly columns. This changes so the totals also include the `Bilans otwarcia` values and add up to the footer `Saldo`.

## Impact

- `src/components/payments/payment-table.tsx`: `Razem` totals computation.
- `src/components/pdf/payment-pdf-document.tsx`: `Razem` row totals (summary tiles unchanged).
- Unit tests for both components, and any E2E assertions on `Razem` amounts.
- No API, schema or import changes.
