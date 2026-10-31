-- Insert apartments numbered 1..count for infinite scrolling tests; shares
-- grow with the number and every fifth apartment is inactive
-- Parameters: $1 = HOA ID, $2 = unique suffix, $3 = count
INSERT INTO "Apartment" (
  id, "externalOwnerId", "externalApartmentId", owner,
  address, building, number, "postalCode", city,
  "shareNumerator", "shareDenominator", "isActive",
  "homeownersAssociationId", "createdAt", "updatedAt"
)
SELECT gen_random_uuid(), 'WS-' || $2 || '-' || n, 'S-' || $2 || '-' || n,
       'Scroll Owner ' || n, 'ul. Przewijana', '1', n::text,
       '00-001', 'Warszawa', n, 1000, n % 5 <> 0, $1, NOW(), NOW()
FROM generate_series(1, $3::int) AS n
