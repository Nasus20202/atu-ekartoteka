-- Insert a rejected user created the given number of seconds ago
-- Parameters: $1 = email, $2 = name, $3 = age in seconds
INSERT INTO "User" (id, email, name, role, status, "emailVerified", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), $1, $2, 'TENANT', 'REJECTED', true,
        NOW() - $3 * INTERVAL '1 second', NOW())
