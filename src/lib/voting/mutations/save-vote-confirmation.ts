import { prisma } from '@/lib/platform/database/prisma';
import type { BallotAnswers } from '@/lib/voting/types/voting';

interface VoteConfirmationInput {
  votingId: string;
  userId: string;
  tokenHash: string;
  answers: BallotAnswers;
  expiresAt: Date;
}

/** Stores a pending ballot, replacing the user's previous one for the voting. */
export async function saveVoteConfirmation(
  input: VoteConfirmationInput
): Promise<string> {
  const [, created] = await prisma.$transaction([
    prisma.votingConfirmation.deleteMany({
      where: { votingId: input.votingId, userId: input.userId },
    }),
    prisma.votingConfirmation.create({ data: input, select: { id: true } }),
  ]);

  return created.id;
}
