# Design

## Share ratio column

Migration `20261031000000_apartment_share_ratio` adds:

```sql
"shareRatio" DOUBLE PRECISION GENERATED ALWAYS AS (
  CASE WHEN "shareDenominator" > 0 THEN "shareNumerator" / "shareDenominator" END
) STORED
```

Prisma cannot declare generated columns, so `schema.prisma` declares `shareRatio Float?` with `@default(dbgenerated("..."))` holding the expression exactly as `prisma db pull` reports it. Any other text makes `prisma migrate dev` report drift. Code never writes the field; Postgres recomputes it on every insert and update.

`buildOrderBy('share')` orders by `{ shareRatio: { sort, nulls: asc ? 'last' : 'first' } }` followed by the natural order.

## Local dates in PDFs

`toLocalIsoDate` (`src/lib/utils/local-date.ts`) formats `YYYY-MM-DD` from local date parts and replaces `toISOString().slice(0, 10)` in all three PDF buttons.

## Notice grouping

`groupByApartment` keys groups by `hoaId` and label, so equal labels from different HOAs form separate pages.

## Dashboard previous month

Unchanged: dashboard charges are loaded from the window start. The `Naliczenia` card already renders a month tile only when that month has charges, so a previous month outside the window is simply absent.
