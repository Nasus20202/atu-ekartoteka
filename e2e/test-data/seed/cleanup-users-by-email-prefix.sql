-- Cleanup users whose email starts with a prefix
-- Parameters: $1 = LIKE pattern, e.g. 'prefix-%'
DELETE FROM "User" WHERE email LIKE $1
