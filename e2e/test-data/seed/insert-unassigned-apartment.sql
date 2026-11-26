-- Insert (or detach) an apartment that has no user
-- Parameters: $1 = externalOwnerId, $2 = externalApartmentId, $3 = owner,
--             $4 = email, $5 = number, $6 = isActive, $7 = HOA ID
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
    $3,
    $4,
    'ul. Testowa',
    '1',
    $5,
    '00-001',
    'Warszawa',
    50.5,
    1000,
    $6,
    $7,
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT ("externalOwnerId", "externalApartmentId") DO UPDATE
SET
  "userId" = NULL,
  "updatedAt" = NOW()
RETURNING
  id
