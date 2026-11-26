-- Delete password resets of users
-- Parameters: $1 = array of user IDs
DELETE FROM "PasswordReset"
WHERE
  "userId" = ANY ($1::TEXT[])
