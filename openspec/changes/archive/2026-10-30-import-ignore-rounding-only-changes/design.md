# Design

## Context

- **Parser.** `parseDecimalValue` keeps the full precision from the file.
- **Storage.** Every imported decimal column is `@db.Decimal(14, 4)`. PostgreSQL rounds values with more digits half away from zero on write.
- **Change detection.** Three functions decide whether a record changed: `hasChargeChanged` in `charges.ts`, `hasNotificationChanged` in `notifications.ts`, and the payment comparison in `payment-data.ts`. All three use `toDecimal(existing).equals(toDecimal(entry))` with no rounding.
- **TEST HOA data.** 273 charge rows in `nal_czynsz.txt` have quantities with more than 4 significant decimal digits. 259 of them belong to imported apartments; the rest are skipped rows. That matches the reported "259 Zaktualizowanych" exactly.

## Goals / Non-Goals

**Goals:** change detection agrees with what the database would actually store.

**Non-Goals:** changing what is written. Prisma still sends the full value, and PostgreSQL still rounds it.

## Decisions

### 1. Round the incoming value to the column scale before comparing

- Add `DB_DECIMAL_SCALE = 4` and `decimalEqualsStored(stored, incoming)` to `src/lib/utils/decimal.ts`.
- The helper computes `toDecimal(incoming).toDecimalPlaces(DB_DECIMAL_SCALE, Decimal.ROUND_HALF_UP)` and compares it with `stored` using `.equals`.
- In decimal.js, `ROUND_HALF_UP` rounds half away from zero, which matches PostgreSQL `numeric`.
- All three importers call the helper in place of the raw `.equals` checks.

**Alternatives considered:**

- **Widen the columns to `Decimal(14, 6)`.** Rejected: it needs a migration, changes stored values and display precision, and would still break on any 7-digit value.
- **Round in the parser.** Rejected: validators such as the sum check (`suma ≠ ilość × cena`) should keep seeing the raw file values.
- **Compare with a tolerance (epsilon).** Rejected: it is less precise than reproducing the database's own rounding.

### 2. Keep the scale in one constant

`DB_DECIMAL_SCALE` sits next to the decimal helpers. A comment points to the `@db.Decimal(14, 4)` columns in `schema.prisma`, so the two stay in sync.

## Risks / Trade-offs

- [The schema scale changes and the constant is not updated] → The comment links them. A unit test asserts the value 4, so any change has to be deliberate.
- [The first re-import after deploy] → No data changes, so there is no migration risk. The counts simply drop to the real number of changed records.
