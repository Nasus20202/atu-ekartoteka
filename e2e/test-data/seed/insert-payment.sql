-- Insert payment record for E2E tests
-- Parameters: $1 = id (apartmentId-year), $2 = apartmentId, $3 = year, $4 = dateFrom, $5 = dateTo
INSERT INTO "Payment" (
  id, "apartmentId", year, "dateFrom", "dateTo", 
  "openingBalance", "closingBalance",
  "januaryPayments", "februaryPayments", "marchPayments", "aprilPayments", 
  "mayPayments", "junePayments", "julyPayments", "augustPayments", 
  "septemberPayments", "octoberPayments", "novemberPayments", "decemberPayments",
  "januaryCharges", "februaryCharges", "marchCharges", "aprilCharges", 
  "mayCharges", "juneCharges", "julyCharges", "augustCharges", 
  "septemberCharges", "octoberCharges", "novemberCharges", "decemberCharges",
  "createdAt", "updatedAt"
)
VALUES (
  $1, $2, $3, $4, $5, 
  0, -444.25,
  444.25, 444.25, 444.25, 444.25, 444.25, 444.25,
  444.25, 444.25, 444.25, 444.25, 444.25, 444.25,
  444.25, 444.25, 444.25, 444.25, 444.25, 444.25,
  444.25, 444.25, 444.25, 444.25, 444.25, 444.25,
  NOW(), NOW()
)
ON CONFLICT ("apartmentId", year) DO UPDATE SET "closingBalance" = -444.25
