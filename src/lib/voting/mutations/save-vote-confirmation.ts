import { prisma } from '@/lib/platform/database/prisma';
import type { VoteAnswers } from '@/lib/voting/types/voting';

interface VoteConfirmationInput {
  id: string;
  votingId: string;
  userId: string;
  codeHash: string;
  answers: VoteAnswers;
  expiresAt: Date;
}

/** Stores a pending ballot, replacing the user's previous one for the voting. */
export function saveVoteConfirmation(input: VoteConfirmationInput) {
  return prisma.$transaction([
    prisma.votingConfirmation.deleteMany({
      where: { votingId: input.votingId, userId: input.userId },
    }),
    prisma.votingConfirmation.create({ data: input, select: { id: true } }),
  ]);
}
