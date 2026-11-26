-- Insert an apartment owned by a user, for the mixed payments fixture
-- Parameters: $1 = externalOwnerId, $2 = externalApartmentId, $3 = email,
--             $4 = HOA ID, $5 = user ID
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
    "userId",
    "createdAt",
    "updatedAt"
  )
VALUES
  (
    gen_random_uuid(),
    $1,
    $2,
    'E2E Mixed Payments User',
    $3,
    'ul. Mieszana',
    '9',
    '9A',
    '00-001',
    'Warszawa',
    12.5,
    100,
    TRUE,
    $4,
    $5,
    NOW(),
    NOW()
  )
RETURNING
  id
