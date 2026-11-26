-- Insert an email verification code
-- Parameters: $1 = hashed code, $2 = user ID, $3 = expiry
INSERT INTO
  "EmailVerification" (
    id,
    code,
    "userId",
    "expiresAt",
    verified,
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
