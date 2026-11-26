-- Create or reset an unverified, pending user
-- Parameters: $1 = email, $2 = password hash
INSERT INTO
  "User" (
    id,
    email,
    password,
    name,
    role,
    status,
    "emailVerified",
    "authMethod",
    "createdAt",
    "updatedAt"
  )
VALUES
  (
    gen_random_uuid(),
    $1,
    $2,
    'Unverified User',
    'TENANT',
    'PENDING',
    FALSE,
    'CREDENTIALS',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE
SET
  password = $2,
  "emailVerified" = FALSE,
  status = 'PENDING'
RETURNING
  id
