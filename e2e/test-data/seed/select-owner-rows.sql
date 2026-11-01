-- Owner rows of a HOA for owner validity tests
-- Parameters: $1 = HOA externalId
-- validFrom/validTo are timestamps without time zone; AT TIME ZONE 'UTC' makes
-- node-pg return the UTC instant regardless of the process timezone
SELECT a.id, a."homeownersAssociationId", a."externalOwnerId", a."isActive",
  a."validFrom" AT TIME ZONE 'UTC' AS "validFrom",
  a."validTo" AT TIME ZONE 'UTC' AS "validTo"
FROM "Apartment" a
JOIN "HomeownersAssociation" h ON h.id = a."homeownersAssociationId"
WHERE h."externalId" = $1
ORDER BY a."externalOwnerId"
