-- Insert a password reset token
-- Parameters: $1 = hashed token, $2 = user ID, $3 = expiry
INSERT INTO
  "PasswordReset" (
    id,
    token,
    "userId",
    "expiresAt",
    used,
    "createdAt",
    "updatedAt"
  )
VALUES
  (
    gen_random_uuid(),
    $1,
    $2,
    $3,
    FALSE,
    NOW(),
    NOW()
  )
