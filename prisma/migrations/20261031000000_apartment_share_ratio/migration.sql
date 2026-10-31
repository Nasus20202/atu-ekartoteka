-- The share as a single number, so the apartments list can sort by the
-- percentage it displays instead of by numerator and denominator separately.
-- The schema mirrors the expression with dbgenerated(), copied from
-- `prisma db pull`; it must match Postgres' text exactly or Migrate sees drift.
ALTER TABLE "Apartment"
    ADD COLUMN "shareRatio" DOUBLE PRECISION GENERATED ALWAYS AS (
        CASE
            WHEN "shareDenominator" > 0 THEN "shareNumerator" / "shareDenominator"
        END
    ) STORED;
