-- The assigned apartments of a HOA, with their owner, in a stable order
-- Parameters: $1 = HOA id
SELECT
  id,
  "userId",
  number
FROM
  "Apartment"
WHERE
  "homeownersAssociationId" = $1
  AND "userId" IS NOT NULL
ORDER BY
  number
