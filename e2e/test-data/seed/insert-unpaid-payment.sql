-- Payment record of a tenant who has not paid yet, for E2E tests.
-- The imported monthly charges and closing balance are deliberately wrong: the
-- app must show figures derived from the charge records instead.
-- Parameters: $1 = id (apartmentId-year), $2 = apartmentId, $3 = year, $4 = dateFrom, $5 = dateTo
INSERT INTO "Payment" (
  id, "apartmentId", year, "dateFrom", "dateTo", 
  "openingBalance", "closingBalance",
  "januaryCharges", "februaryCharges", "marchCharges", "aprilCharges", 
  "mayCharges", "juneCharges", "julyCharges", "augustCharges", 
  "septemberCharges", "octoberCharges", "novemberCharges", "decemberCharges",
  "createdAt", "updatedAt"
)
VALUES (
  $1, $2, $3, $4, $5, 
  0, 999,
  1.11, 1.11, 1.11, 1.11, 1.11, 1.11,
  1.11, 1.11, 1.11, 1.11, 1.11, 1.11,
  NOW(), NOW()
)
ON CONFLICT ("apartmentId", year) DO NOTHING
