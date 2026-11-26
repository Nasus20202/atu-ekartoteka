-- Create or rename a HOA whose name equals its external ID
-- Parameters: $1 = externalId
INSERT INTO
  "HomeownersAssociation" (id, "externalId", name, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), $1, $1, NOW(), NOW())
ON CONFLICT ("externalId") DO UPDATE
SET
  name = $1
RETURNING
  id
