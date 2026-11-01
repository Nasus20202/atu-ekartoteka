-- Insert a single charge line for E2E tests
-- Parameters: $1 = apartmentId, $2 = dateFrom, $3 = dateTo, $4 = period, $5 = line number, $6 = amount
INSERT INTO "Charge" (
  id, "externalLineNo", "apartmentId", "dateFrom", "dateTo", period,
  description, quantity, unit, "unitPrice", "totalAmount",
  "createdAt", "updatedAt"
)
VALUES
  (gen_random_uuid(), $5, $1, $2, $3, $4, 'Opłata testowa', 1, 'szt', $6, $6, NOW(), NOW())
ON CONFLICT ("apartmentId", period, "externalLineNo") DO NOTHING
