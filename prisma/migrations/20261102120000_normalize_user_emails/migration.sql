-- Normalise user emails without touching a pair that would violate the unique
-- constraint. Such a pair is left as-is; lookups are case-insensitive.
UPDATE "User" AS u
SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (
    SELECT 1
    FROM "User" AS other
    WHERE lower(other."email") = lower(u."email")
      AND other."id" <> u."id"
  );
