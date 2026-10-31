-- Insert rejected users sharing an email prefix, backdated so they sort after
-- every other user
-- Parameters: $1 = email prefix, $2 = count
INSERT INTO "User" (id, email, name, role, status, "emailVerified", "createdAt", "updatedAt")
SELECT gen_random_uuid(), $1 || '-' || n || '@e2e-test.com', 'Scroll User ' || n,
       'TENANT', 'REJECTED', true,
       TIMESTAMP '2000-01-01' - n * INTERVAL '1 second', NOW()
FROM generate_series(1, $2::int) AS n
