-- Delete users
-- Parameters: $1 = array of user IDs
DELETE FROM "User"
WHERE
  id = ANY ($1::TEXT[])
