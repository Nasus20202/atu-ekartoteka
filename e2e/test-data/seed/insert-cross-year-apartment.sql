-- Create or reset the apartment of the cross-year import fixture
-- Parameters: $1 = HOA ID
INSERT INTO
  "Apartment" (
    id,
    "externalOwnerId",
    "externalApartmentId",
    owner,
    email,
    address,
    building,
    number,
    "postalCode",
    city,
    "shareNumerator",
    "shareDenominator",
    "isActive",
    "homeownersAssociationId",
    "createdAt",
    "updatedAt"
  )
VALUES
  (
    gen_random_uuid(),
    'W00001',
    'TEST04-TEST04-00000-00001M',
    'Test Cross Year',
    'test04@test.com',
    'ul. Testowa',
    '1',
    '1A',
    '00-001',
    'Warszawa',
    50.5,
    1000,
    TRUE,
    $1,
    NOW(),
    NOW()
  )
ON CONFLICT ("externalOwnerId", "externalApartmentId") DO UPDATE
SET
  owner = 'Test Cross Year',
  email = 'test04@test.com',
  "homeownersAssociationId" = $1,
  "isActive" = TRUE
RETURNING
  id
