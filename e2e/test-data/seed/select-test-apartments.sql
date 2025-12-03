-- Select test apartments by HOA IDs
-- Parameters: $1 = array of HOA IDs
SELECT id FROM "Apartment" WHERE "homeownersAssociationId" = ANY($1)
