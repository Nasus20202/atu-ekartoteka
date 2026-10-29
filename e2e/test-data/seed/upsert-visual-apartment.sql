-- Upsert apartment for visual regression tests
-- Parameters: $1 = owner name, $2 = email, $3 = hoaId, $4 = userId,
-- $5 = externalOwnerId, $6 = externalApartmentId, $7 = address, $8 = building, $9 = number
INSERT INTO "Apartment" (
  id, "externalOwnerId", "externalApartmentId", owner, email,
  address, building, number, "postalCode", city,
  "shareNumerator", "shareDenominator", "isActive",
  "homeownersAssociationId", "userId", "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(), $5, $6, $1, $2,
  $7, $8, $9, '00-001', 'Testowo',
  50.5, 1000, true,
  $3, $4, NOW(), NOW()
)
ON CONFLICT ("externalOwnerId", "externalApartmentId") DO UPDATE SET "userId" = $4, owner = $1
RETURNING id
