-- Cleanup test HOAs
-- Parameters: $1 = array of HOA IDs
DELETE FROM "HomeownersAssociation" WHERE id = ANY($1)
