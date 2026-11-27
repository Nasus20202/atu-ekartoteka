-- Insert a voting with a fixed id and dates for visual regression tests
-- Parameters: $1 = id, $2 = HOA id, $3 = title, $4 = description, $5 = status,
--             $6 = deadline (may be NULL), $7 = created at
INSERT INTO
  "Voting" (
    id,
    "hoaId",
    title,
    description,
    status,
    "endsAt",
    "createdAt",
    "updatedAt"
  )
VALUES
  ($1, $2, $3, $4, $5::"VotingStatus", $6, $7, $7)
