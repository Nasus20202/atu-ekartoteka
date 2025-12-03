-- Insert charge notifications for E2E tests
-- Parameters: $1 = apartmentId
INSERT INTO "ChargeNotification" (
  id, "lineNo", "apartmentId", description, quantity, unit, "unitPrice", "totalAmount", 
  "createdAt", "updatedAt"
)
VALUES 
  (gen_random_uuid(), 1, $1, 'Zarządzanie Nieruchomością Wspólną', 1, 'szt', 73, 73, NOW(), NOW()),
  (gen_random_uuid(), 2, $1, 'Koszta zarządu - eksploatacja', 1, 'szt.', 245, 245, NOW(), NOW()),
  (gen_random_uuid(), 3, $1, 'Fundusz remontowy', 50.5, 'm2', 2.50, 126.25, NOW(), NOW())
ON CONFLICT ("apartmentId", "lineNo") DO NOTHING
