-- Cleanup all apartments of an HOA
-- Parameters: $1 = HOA ID
DELETE FROM "Apartment" WHERE "homeownersAssociationId" = $1
