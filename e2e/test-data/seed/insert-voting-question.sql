-- Insert a voting question with a given id
-- Parameters: $1 = id, $2 = voting id, $3 = position, $4 = text
INSERT INTO
  "VotingQuestion" (id, "votingId", position, text)
VALUES
  ($1, $2, $3, $4)
