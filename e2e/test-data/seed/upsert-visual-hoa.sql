-- Upsert HOA for visual regression tests
-- Parameters: $1 = externalId, $2 = name, $3 = header
INSERT INTO "HomeownersAssociation" (id, "externalId", name, header, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
ON CONFLICT ("externalId") DO UPDATE SET name = $2, header = $3
RETURNING id
