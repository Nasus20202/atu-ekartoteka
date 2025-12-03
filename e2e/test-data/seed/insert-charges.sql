-- Insert charges for E2E tests
-- Parameters: $1 = apartmentId, $2 = dateFrom, $3 = dateTo, $4 = period
INSERT INTO "Charge" (
  id, "externalLineNo", "apartmentId", "dateFrom", "dateTo", period, 
  description, quantity, unit, "unitPrice", "totalAmount", 
  "createdAt", "updatedAt"
)
VALUES 
  (gen_random_uuid(), 1, $1, $2, $3, $4, 'Zarządzanie Nieruchomością Wspólną', 1, 'szt', 73, 73, NOW(), NOW()),
  (gen_random_uuid(), 2, $1, $2, $3, $4, 'Koszta zarządu - eksploatacja', 1, 'szt.', 245, 245, NOW(), NOW()),
  (gen_random_uuid(), 3, $1, $2, $3, $4, 'Fundusz remontowy', 50.5, 'm2', 2.50, 126.25, NOW(), NOW())
ON CONFLICT ("apartmentId", period, "externalLineNo") DO NOTHING
RETURNING id
