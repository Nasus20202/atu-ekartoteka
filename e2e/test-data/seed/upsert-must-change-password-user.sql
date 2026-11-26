-- Create or reset a tenant that must change the password
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
    "mustChangePassword",
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
    'APPROVED',
    TRUE,
    TRUE,
    'CREDENTIALS',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE
SET
  password = $2,
  "mustChangePassword" = TRUE,
  "updatedAt" = NOW()
