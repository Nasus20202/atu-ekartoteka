-- Let the emailed confirmation links of a voting expire, as if time had passed
-- Parameters: $1 = voting id
UPDATE "VotingConfirmation"
SET
  "expiresAt" = NOW() - INTERVAL '1 minute'
WHERE
  "votingId" = $1;
