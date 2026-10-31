# Design

## Context

- Tenant charge lists filter periods with `isPeriodAfterDate(period, chargesDataDate)` in `ChargesDisplay`, `MultiChargesDisplay` and `PaymentTable`; the dashboard instead passes `dateToPeriod(now)` to the trend, balances and tiles.
- Tenant queries already load `payments` for the dashboard (`findUserWithApartments`); `getNonEmptyMonths` and `monthIndexToPeriod` already turn a `Payment` row into charged periods.
- Tooltip colours come from `TOOLTIP_CONTENT_STYLE`, which sets no `color`, so Recharts falls back to its dark default for the title and for items without a series colour (bars drawn with `Cell`).

## Goals / Non-Goals

**Goals:** one cutoff for all tenant views, derived from data; readable tooltips in both themes.

**Non-Goals:** a manual date override (declined: data-derived cutoff supersedes it); removing `chargesDataDate` from import or admin UI; changing admin views.

## Decisions

1. **Cutoff = latest period with a non-zero monthly charge in payments, capped at `dateToPeriod(now)`.** A pure helper `getChargeCutoffPeriod(payments, now)` next to `payment-months.ts` reuses `getNonEmptyMonths` and returns `null` without payments. Alternative: latest `Charge.period` — rejected, as the user asked for payments and charge rows are what extends past the snapshot today. Alternative: keep the WMB date and add a setting — rejected as more UI for a weaker signal.
2. **Per-apartment on apartment pages, max across apartments in combined views.** A combined list must not hide a month that one apartment still charges; apartments whose own data ends earlier simply have no rows there.
3. **Dashboard anchors on the cutoff, falling back to the current month.** `getDashboardPeriods` takes the cutoff; previous period is the month before it. Charts already take an end period, so no chart change is needed.
4. **A dedicated query feeds the charges pages.** `findLatestChargedPayments(apartmentIds)` returns one row per apartment (`distinct: apartmentId`, `orderBy year desc`, filtered in Prisma to rows with any non-zero charge column) selecting only the year and twelve charge fields. The dashboard reuses the payments it already loads.
5. **Drop `chargesDataDate` props** from the two charges components and the payment table, replacing them with a `cutoffPeriod` prop and `period > cutoffPeriod`; delete `isPeriodAfterDate` and `getCommonChargesDataDate` if unused.
6. **Tooltip colour set once in `chart-styles.ts`**: `color` on the content style plus `itemStyle`/`labelStyle` using `hsl(var(--foreground))`, applied by every chart already importing those constants.

## Risks / Trade-offs

- Months imported after the WMB snapshot but charged in payments now appear → intended; admin can still see the snapshot dates in the HOA list.
- A payments file lagging behind charges hides newer charges → accepted, it is the requested definition.
- Extra payments select on the charges pages → one row, twelve decimals; negligible.
