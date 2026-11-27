-- Insert the answer of a ballot to one question
-- Parameters: $1 = id, $2 = ballot id, $3 = question id, $4 = choice
INSERT INTO
  "VotingVote" (id, "ballotId", "questionId", choice)
VALUES
  ($1, $2, $3, $4::"VoteChoice")
