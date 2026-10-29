-- Parameters: $1 = HOA count, $2 = apartments per HOA, $3 = tenant count
-- Tenants own evenly spaced apartments, so they are spread across all HOAs
WITH sizing AS (
  SELECT $2::int AS per_hoa, GREATEST(1, ($1::int * $2::int) / $3::int) AS stride
)
INSERT INTO "Apartment" (
  id, "externalOwnerId", "externalApartmentId", owner, email, address, building, number,
  "postalCode", city, "shareNumerator", "shareDenominator", "isActive",
  "homeownersAssociationId", "userId", "createdAt", "updatedAt"
)
SELECT
  'perf-apt-' || n, 'W' || lpad(n::text, 6, '0'),
  'PERF' || lpad((((n - 1) / per_hoa) + 1)::text, 4, '0') || '-' || lpad(n::text, 6, '0'),
  'Perf Owner ' || n, 'owner-' || n || '@perf-test.com', 'ul. Perfowa', ((n - 1) % 20 + 1)::text,
  (((n - 1) % per_hoa) + 1)::text, '80-001', 'Gdańsk', 50.5, 1000, true,
  'perf-hoa-' || (((n - 1) / per_hoa) + 1),
  CASE WHEN (n - 1) % stride = 0 AND (n - 1) / stride < $3::int
    THEN 'perf-user-' || (((n - 1) / stride) + 1) END,
  NOW(), NOW()
FROM sizing, generate_series(1, $1::int * $2::int) AS n
ON CONFLICT ("externalOwnerId", "externalApartmentId") DO NOTHING
