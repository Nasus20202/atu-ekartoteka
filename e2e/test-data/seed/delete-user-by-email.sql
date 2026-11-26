-- Delete a user by email
-- Parameters: $1 = email
DELETE FROM "User"
WHERE
  email = $1
