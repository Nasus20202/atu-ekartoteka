-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tenantHistoryYearsBack" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AppSettings_singleton" CHECK ("id" = 1),
    CONSTRAINT "AppSettings_tenantHistoryYearsBack_range" CHECK ("tenantHistoryYearsBack" BETWEEN 0 AND 20)
);

-- Carry the stored value over. Always yields exactly one row: a missing,
-- non-numeric, fractional, negative or out-of-range old value becomes the default (2).
-- The cast only runs inside the CASE branch that already matched the digit pattern.
INSERT INTO "AppSettings" ("id", "tenantHistoryYearsBack", "updatedAt")
SELECT 1,
  COALESCE(
    (SELECT "years" FROM (
        SELECT CASE
            WHEN jsonb_typeof("value") = 'number'
              AND ("value" #>> '{}') ~ '^[0-9]{1,2}$'
            THEN ("value" #>> '{}')::int
          END AS "years"
        FROM "AppSetting"
        WHERE "key" = 'tenantHistoryYearsBack'
      ) AS "stored"
      WHERE "years" BETWEEN 0 AND 20),
    2),
  CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "AppSetting";
