-- Delete email verifications of users
-- Parameters: $1 = array of user IDs
DELETE FROM "EmailVerification"
WHERE
  "userId" = ANY ($1::TEXT[])
