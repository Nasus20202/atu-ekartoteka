-- Upsert regular user for E2E tests
-- Parameters: $1 = email, $2 = password hash, $3 = name
INSERT INTO "User" (id, email, password, name, role, status, "emailVerified", "authMethod", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), $1, $2, $3, 'TENANT', 'APPROVED', true, 'CREDENTIALS', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = $2, name = $3, status = 'APPROVED'
RETURNING id
