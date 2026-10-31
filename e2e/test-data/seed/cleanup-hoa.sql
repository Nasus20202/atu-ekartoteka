-- Cleanup one HOA
-- Parameters: $1 = HOA ID
DELETE FROM "HomeownersAssociation" WHERE id = $1
