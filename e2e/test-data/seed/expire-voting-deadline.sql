-- Move a voting's deadline into the past, as if time had passed
-- Parameters: $1 = voting id
UPDATE "Voting"
SET
  "endsAt" = NOW() - INTERVAL '1 minute'
WHERE
  id = $1;
