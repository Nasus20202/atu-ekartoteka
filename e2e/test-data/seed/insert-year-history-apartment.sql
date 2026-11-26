-- Insert the apartment of the HOA with several years of payments
-- Parameters: $1 = hoaId
INSERT INTO
  "Apartment" (
    id,
    "externalOwnerId",
    "externalApartmentId",
    owner,
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
    'WYEARS01',
    'TESTYEARS-TESTYEARS-00000-00001M',
    'Właściciel Wieloletni',
    'ul. Wieloletnia',
    '5',
    '5',
    '00-005',
    'Warszawa',
    10,
    1000,
    TRUE,
    $1,
    NOW(),
    NOW()
  )
RETURNING
  id
