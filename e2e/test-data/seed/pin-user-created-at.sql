-- Pin the creation dates of seeded users so dates on screen do not change between runs
-- Parameters: $1 = emails (text[]), $2 = creation timestamps (text[], same order as emails)
UPDATE "User" AS u
SET "createdAt" = pinned.created_at
FROM unnest($1::text[], $2::timestamptz[]) AS pinned(email, created_at)
WHERE u.email = pinned.email
