-- CreateEnum
CREATE TYPE "VotingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESULTS_PUBLISHED', 'ARCHIVED');
-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('FOR', 'AGAINST', 'ABSTAIN');
-- CreateTable
CREATE TABLE "Voting" (
    "id" TEXT NOT NULL,
    "hoaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "VotingStatus" NOT NULL DEFAULT 'DRAFT',
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Voting_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "VotingQuestion" (
    "id" TEXT NOT NULL,
    "votingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "VotingQuestion_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "VotingBallot" (
    "id" TEXT NOT NULL,
    "votingId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotingBallot_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "VotingVote" (
    "id" TEXT NOT NULL,
    "ballotId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    CONSTRAINT "VotingVote_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "VotingConfirmation" (
    "id" TEXT NOT NULL,
    "votingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotingConfirmation_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "Voting_hoaId_idx" ON "Voting"("hoaId");
-- CreateIndex
CREATE INDEX "Voting_status_idx" ON "Voting"("status");
-- CreateIndex
CREATE UNIQUE INDEX "VotingQuestion_votingId_position_key" ON "VotingQuestion"("votingId", "position");
-- CreateIndex
CREATE INDEX "VotingBallot_userId_idx" ON "VotingBallot"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "VotingBallot_votingId_apartmentId_key" ON "VotingBallot"("votingId", "apartmentId");
-- CreateIndex
CREATE INDEX "VotingVote_questionId_choice_idx" ON "VotingVote"("questionId", "choice");
-- CreateIndex
CREATE UNIQUE INDEX "VotingVote_ballotId_questionId_key" ON "VotingVote"("ballotId", "questionId");
-- CreateIndex
CREATE INDEX "VotingConfirmation_expiresAt_idx" ON "VotingConfirmation"("expiresAt");
-- CreateIndex
CREATE UNIQUE INDEX "VotingConfirmation_votingId_userId_key" ON "VotingConfirmation"("votingId", "userId");
-- AddForeignKey
ALTER TABLE "Voting" ADD CONSTRAINT "Voting_hoaId_fkey" FOREIGN KEY ("hoaId") REFERENCES "HomeownersAssociation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VotingQuestion" ADD CONSTRAINT "VotingQuestion_votingId_fkey" FOREIGN KEY ("votingId") REFERENCES "Voting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VotingBallot" ADD CONSTRAINT "VotingBallot_votingId_fkey" FOREIGN KEY ("votingId") REFERENCES "Voting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VotingBallot" ADD CONSTRAINT "VotingBallot_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VotingBallot" ADD CONSTRAINT "VotingBallot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VotingVote" ADD CONSTRAINT "VotingVote_ballotId_fkey" FOREIGN KEY ("ballotId") REFERENCES "VotingBallot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VotingVote" ADD CONSTRAINT "VotingVote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "VotingQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VotingConfirmation" ADD CONSTRAINT "VotingConfirmation_votingId_fkey" FOREIGN KEY ("votingId") REFERENCES "Voting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VotingConfirmation" ADD CONSTRAINT "VotingConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bounds enforced in the database as well as in the use cases.
ALTER TABLE "Voting"
  ADD CONSTRAINT "Voting_title_length" CHECK (char_length("title") BETWEEN 1 AND 200),
  ADD CONSTRAINT "Voting_description_length" CHECK (char_length("description") <= 5000);

ALTER TABLE "VotingQuestion"
  ADD CONSTRAINT "VotingQuestion_position_check" CHECK ("position" >= 0),
  ADD CONSTRAINT "VotingQuestion_text_length" CHECK (char_length("text") BETWEEN 1 AND 1000);

ALTER TABLE "VotingConfirmation"
  ADD CONSTRAINT "VotingConfirmation_attempts_check" CHECK ("attempts" >= 0);
