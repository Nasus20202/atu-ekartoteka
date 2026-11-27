-- Count the ballots stored for a voting
-- Parameters: $1 = voting id
SELECT
  COUNT(*)::int AS count
FROM
  "VotingBallot"
WHERE
  "votingId" = $1;
