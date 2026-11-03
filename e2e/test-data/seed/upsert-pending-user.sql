-- Upsert pending user (registered, waiting for admin approval) for visual regression tests
-- Parameters: $1 = email, $2 = password hash, $3 = name
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
    $3,
    'TENANT',
    'PENDING',
    TRUE,
    'CREDENTIALS',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE
SET
  password = $2,
  name = $3,
  status = 'PENDING'
RETURNING
  id
