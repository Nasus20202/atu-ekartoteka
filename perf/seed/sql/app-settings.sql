-- Parameters: $1 = tenant history years back
INSERT INTO
  "AppSettings" (id, "tenantHistoryYearsBack", "updatedAt")
VALUES
  (1, $1::int, NOW())
ON CONFLICT (id) DO UPDATE
SET
  "tenantHistoryYearsBack" = EXCLUDED."tenantHistoryYearsBack",
  "updatedAt" = NOW();
