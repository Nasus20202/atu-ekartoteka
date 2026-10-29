-- Parameters: $1 = apartment count, $2 = years of history
INSERT INTO "Payment" (
  id, "apartmentId", year, "dateFrom", "dateTo", "openingBalance", "closingBalance",
  "januaryPayments", "februaryPayments", "marchPayments", "aprilPayments", "mayPayments",
  "junePayments", "julyPayments", "augustPayments", "septemberPayments", "octoberPayments",
  "novemberPayments", "decemberPayments", "januaryCharges", "februaryCharges", "marchCharges",
  "aprilCharges", "mayCharges", "juneCharges", "julyCharges", "augustCharges",
  "septemberCharges", "octoberCharges", "novemberCharges", "decemberCharges",
  "createdAt", "updatedAt"
)
SELECT 'perf-pay-' || n || '-' || y, 'perf-apt-' || n, y, make_date(y, 1, 1), make_date(y, 12, 31),
  0, -100,
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, NOW(), NOW()
FROM generate_series(1, $1::int) AS n,
  generate_series(EXTRACT(year FROM NOW())::int - $2::int + 1, EXTRACT(year FROM NOW())::int) AS y
ON CONFLICT ("apartmentId", year) DO NOTHING
