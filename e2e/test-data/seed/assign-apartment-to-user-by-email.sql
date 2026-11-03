-- Assign an apartment to the existing user with the given email
-- Parameters: $1 = apartment id, $2 = user email
UPDATE "Apartment"
SET
  "userId" = (
    SELECT
      id
    FROM
      "User"
    WHERE
      email = $2
  )
WHERE
  id = $1;
