-- Upsert HOA for E2E tests
-- Parameters: none (uses hardcoded TEST01)
INSERT INTO "HomeownersAssociation" (id, "externalId", name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'TEST01', 'Test HOA', NOW(), NOW())
ON CONFLICT ("externalId") DO UPDATE SET name = 'Test HOA'
RETURNING id
