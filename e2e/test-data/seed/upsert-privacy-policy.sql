INSERT INTO
  "AppSettings" (id, "privacyPolicy", "updatedAt")
VALUES
  (1, $1, NOW())
ON CONFLICT (id) DO UPDATE
SET
  "privacyPolicy" = $1,
  "updatedAt" = NOW()
