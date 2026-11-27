-- Delete utility settlements of apartments; their rows go with them
-- Parameters: $1 = array of apartment IDs
DELETE FROM "UtilitySettlement"
WHERE
  "apartmentId" = ANY ($1::TEXT[])
