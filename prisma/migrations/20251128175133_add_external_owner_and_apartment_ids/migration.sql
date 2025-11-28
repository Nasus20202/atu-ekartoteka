/*
  Warnings:

  - Dropping `externalId` columns will lose data.
  - Unique constraints will fail if duplicates exist.
  - Adding required columns without defaults requires populating them first.
*/

-- Drop old indexes
DROP INDEX "Apartment_externalId_idx";
DROP INDEX "Apartment_externalId_key";
DROP INDEX "Charge_apartmentId_period_externalLineNo_externalId_key";
DROP INDEX "ChargeNotification_apartmentId_lineNo_externalId_key";
DROP INDEX "Payment_apartmentId_year_externalId_key";

-- Alter Apartment table: add new columns
ALTER TABLE "Apartment" ADD COLUMN "externalApartmentId" TEXT;
ALTER TABLE "Apartment" ADD COLUMN "externalOwnerId" TEXT;

-- Populate new columns with placeholder / mapping
UPDATE "Apartment"
SET "externalApartmentId" = "externalId",
    "externalOwnerId" = COALESCE((SELECT DISTINCT c."externalId" FROM "Charge" c WHERE c."apartmentId" = "Apartment"."id" LIMIT 1), 'unknown_owner');

-- Make columns NOT NULL
ALTER TABLE "Apartment"
ALTER COLUMN "externalApartmentId" SET NOT NULL,
ALTER COLUMN "externalOwnerId" SET NOT NULL;

-- Drop externalId from other tables
ALTER TABLE "Charge" DROP COLUMN "externalId";
ALTER TABLE "ChargeNotification" DROP COLUMN "externalId";
ALTER TABLE "Payment" DROP COLUMN "externalId";

-- Fix duplicates before creating unique indexes

-- Charge: remove duplicate (apartmentId, period, externalLineNo)
DELETE FROM "Charge" c
USING (
    SELECT MIN(id) AS keep_id, "apartmentId", period, "externalLineNo"
    FROM "Charge"
    GROUP BY "apartmentId", period, "externalLineNo"
    HAVING COUNT(*) > 1
) dup
WHERE c."apartmentId" = dup."apartmentId"
  AND c.period = dup.period
  AND c."externalLineNo" = dup."externalLineNo"
  AND c.id <> dup.keep_id;

-- ChargeNotification: remove duplicate (apartmentId, lineNo)
DELETE FROM "ChargeNotification" cn
USING (
    SELECT MIN(id) AS keep_id, "apartmentId", "lineNo"
    FROM "ChargeNotification"
    GROUP BY "apartmentId", "lineNo"
    HAVING COUNT(*) > 1
) dup
WHERE cn."apartmentId" = dup."apartmentId"
  AND cn."lineNo" = dup."lineNo"
  AND cn.id <> dup.keep_id;

-- Payment: remove duplicate (apartmentId, year)
DELETE FROM "Payment" p
USING (
    SELECT MIN(id) AS keep_id, "apartmentId", year
    FROM "Payment"
    GROUP BY "apartmentId", year
    HAVING COUNT(*) > 1
) dup
WHERE p."apartmentId" = dup."apartmentId"
  AND p.year = dup.year
  AND p.id <> dup.keep_id;

-- Create new indexes
CREATE INDEX "Apartment_externalOwnerId_idx" ON "Apartment"("externalOwnerId");
CREATE INDEX "Apartment_externalApartmentId_idx" ON "Apartment"("externalApartmentId");
CREATE UNIQUE INDEX "Apartment_externalOwnerId_externalApartmentId_key" ON "Apartment"("externalOwnerId", "externalApartmentId");
CREATE UNIQUE INDEX "Charge_apartmentId_period_externalLineNo_key" ON "Charge"("apartmentId", "period", "externalLineNo");
CREATE UNIQUE INDEX "ChargeNotification_apartmentId_lineNo_key" ON "ChargeNotification"("apartmentId", "lineNo");
CREATE UNIQUE INDEX "Payment_apartmentId_year_key" ON "Payment"("apartmentId", "year");

ALTER TABLE "Apartment" DROP COLUMN "externalId";
