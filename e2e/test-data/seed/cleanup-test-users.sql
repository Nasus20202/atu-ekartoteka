-- Cleanup test users and related records
-- Parameters: $1 = array of user IDs

-- Delete email verifications
DELETE FROM "EmailVerification" WHERE "userId" = ANY($1);

-- Delete password resets
DELETE FROM "PasswordReset" WHERE "userId" = ANY($1);

-- Unassign apartments from test users
UPDATE "Apartment" SET "userId" = NULL WHERE "userId" = ANY($1);

-- Delete test users
DELETE FROM "User" WHERE id = ANY($1);
