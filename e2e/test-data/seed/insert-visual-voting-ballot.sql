-- Insert one apartment's ballot with a fixed id and date
-- Parameters: $1 = id, $2 = voting id, $3 = apartment id, $4 = user id, $5 = created at
INSERT INTO
  "VotingBallot" (
    id,
    "votingId",
    "apartmentId",
    "userId",
    "createdAt"
  )
VALUES
  ($1, $2, $3, $4, $5)
