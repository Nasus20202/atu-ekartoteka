-- Detach apartments from users
-- Parameters: $1 = array of user IDs
UPDATE "Apartment"
SET
  "userId" = NULL
WHERE
  "userId" = ANY ($1::TEXT[])
