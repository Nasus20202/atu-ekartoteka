-- Insert an approved tenant with a password
-- Parameters: $1 = email, $2 = password hash, $3 = name
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
VALUES
  (
    gen_random_uuid(),
    $1,
    $3,
    $2,
    'TENANT',
    'APPROVED',
    TRUE,
    FALSE,
    'CREDENTIALS',
    NOW(),
    NOW()
  )
RETURNING
  id
