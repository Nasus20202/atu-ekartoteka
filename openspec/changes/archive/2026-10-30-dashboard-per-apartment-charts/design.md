# Design

## Balance history

`getBalanceHistory(payments, endPeriod)` walks every stored payment year oldest first, starting each year from its `openingBalance` and adding `payments − charges` for each non-empty month up to `endPeriod`. Months without activity carry the last known balance forward, so the series is continuous up to the current month.

`mergeBalanceHistories` combines the per-apartment histories into one dataset keyed `apt_<index>`. Periods run from the earliest apartment start to the shared end period; an apartment has no value before its first month.

The dashboard query now loads every payment year (`take: 1` removed). `payments[0]` is still the latest year, so existing consumers keep working.

## Colours

- Single apartment: bars coloured by sign (green ≥ 0, red < 0).
- Several apartments: one colour per apartment from the shared series palette, plus a legend. The charge trend uses the same palette in apartment order.

## Axis

The zero reference line uses `ifOverflow="extendDomain"` so the automatic domain always includes 0 while ticks stay rounded. A shared `createYAxisTick` renders the `0` tick in bold. Dashboard charts use a compact `PLN` currency formatter (`1,2 tys. zł`).

## Navigation

Charts build links with `chart-links.ts`:

- charge month → `/dashboard/charges/<apartmentId>?month=YYYY-MM` for a single apartment, otherwise `/dashboard/charges?month=YYYY-MM`;
- balance bar → `/dashboard/payments/<apartmentId>/<year>`.

The combined charges page opens, highlights and scrolls to the requested month, as the per-apartment page already does.

## Shared pieces

`useChartViewport` and `ChartViewportNav` hold the 12-month window logic previously inline in the charge trend chart, and are reused by the balance chart.

## Charges page expansion

Both `ChargesDisplay` and `MultiChargesDisplay` start with only the newest year open and no month open. With `activeMonth` they also open that month's year and the month itself, highlight it and scroll it into view after the collapsible animation. `html { scroll-padding-top }` keeps the scrolled month clear of the sticky header.

## Payment year switcher

`findApartmentPaymentYears(apartmentId, userId)` returns the owner's stored years newest first and is fetched in parallel with the selected year's data. `PaymentYearSelect` reuses the shared `Select` and navigates with `router.push`; it renders only when there is more than one year.
