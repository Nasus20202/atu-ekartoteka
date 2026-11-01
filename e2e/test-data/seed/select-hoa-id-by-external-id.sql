-- Find the id of a HOA by its external ID
-- Parameters: $1 = externalId
SELECT id
FROM "HomeownersAssociation"
WHERE "externalId" = $1
