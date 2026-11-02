-- Normalise user emails to the canonical form used by the application
-- (trimmed and lowercased). Registered addresses must be unique in that form,
-- so refuse to continue if two rows would collapse into the same address.
-- Nothing has to be merged automatically: resolve such a pair by hand and
-- re-run the migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User"
    GROUP BY lower(btrim("email"))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot normalise user emails: duplicates after lower(btrim(email))';
  END IF;
END
$$;

-- Idempotent: already-normalised rows do not match the WHERE clause.
UPDATE "User"
SET "email" = lower(btrim("email"))
WHERE "email" <> lower(btrim("email"));
