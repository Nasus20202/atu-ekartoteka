-- Parameters: $1 = tenant count, $2 = password hash
INSERT INTO "User" (id, email, password, name, role, status, "emailVerified", "authMethod", "createdAt", "updatedAt")
SELECT 'perf-user-' || t, 'perf-user-' || t || '@perf-test.com', $2, 'Perf User ' || t,
  'TENANT', 'APPROVED', true, 'CREDENTIALS', NOW(), NOW()
FROM generate_series(1, $1::int) AS t
ON CONFLICT (email) DO NOTHING
