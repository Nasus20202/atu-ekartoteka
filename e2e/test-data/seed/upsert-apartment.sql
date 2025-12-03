-- Upsert apartment for E2E tests
-- Parameters: $1 = owner name, $2 = email, $3 = hoaId, $4 = userId
INSERT INTO "Apartment" (
  id, "externalOwnerId", "externalApartmentId", owner, email, 
  address, building, number, "postalCode", city, 
  "shareNumerator", "shareDenominator", "isActive", 
  "homeownersAssociationId", "userId", "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(), 'W00001', 'TEST01-TEST01-00000-00001M', $1, $2, 
  'ul. Testowa', '1', '1A', '00-001', 'Warszawa', 
  50.5, 1000, true, 
  $3, $4, NOW(), NOW()
)
ON CONFLICT ("externalOwnerId", "externalApartmentId") DO UPDATE SET "userId" = $4, owner = $1
RETURNING id
