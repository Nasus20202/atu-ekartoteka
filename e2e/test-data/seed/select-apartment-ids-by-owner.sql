-- Find apartments that belong to an email or a user
-- Parameters: $1 = email, $2 = user ID (may be NULL)
SELECT
  id
FROM
  "Apartment"
WHERE
  email = $1
  OR "userId" = $2
