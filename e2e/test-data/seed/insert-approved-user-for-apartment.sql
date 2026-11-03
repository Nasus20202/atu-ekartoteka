-- Create (or reuse) the approved tenant a bulk account creation would make for an apartment
-- Parameters: $1 = apartment id, $2 = bcrypt password hash
WITH
  apartment AS (
    SELECT
      email,
      owner
    FROM
      "Apartment"
    WHERE
      id = $1
  ),
  created_user AS (
    INSERT INTO
      "User" (
        id,
        email,
        name,
        password,
        role,
        status,
        "emailVerified",
        "mustChangePassword",
        "authMethod",
        "createdAt",
        "updatedAt"
      )
    SELECT
      gen_random_uuid(),
      email,
      owner,
      $2,
      'TENANT',
      'APPROVED',
      TRUE,
      TRUE,
      'CREDENTIALS',
      NOW(),
      NOW()
    FROM
      apartment
    ON CONFLICT (email) DO UPDATE
    SET
      "updatedAt" = NOW()
    RETURNING
      id
  )
UPDATE "Apartment"
SET
  "userId" = (
    SELECT
      id
    FROM
      created_user
  )
WHERE
  id = $1;
