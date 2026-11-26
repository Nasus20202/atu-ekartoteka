-- Find the id of a user by email
-- Parameters: $1 = email
SELECT
  id
FROM
  "User"
WHERE
  email = $1
