-- Delete a password reset by its hashed token
-- Parameters: $1 = hashed token
DELETE FROM "PasswordReset"
WHERE
  token = $1
