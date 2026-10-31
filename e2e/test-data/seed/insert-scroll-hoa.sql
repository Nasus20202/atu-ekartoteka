-- Insert the HOA for infinite scrolling tests
-- Parameters: $1 = externalId, $2 = name
INSERT INTO "HomeownersAssociation" (id, "externalId", name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
RETURNING id
