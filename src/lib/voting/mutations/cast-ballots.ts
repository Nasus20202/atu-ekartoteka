import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/platform/database/prisma';
import { isVotingOpen } from '@/lib/voting/rules/voting-status';
import type { VoteAnswers } from '@/lib/voting/types/voting';

interface CastBallotsInput {
  confirmationId: string;
  votingId: string;
  hoaId: string;
  userId: string;
  answers: VoteAnswers;
  now: Date;
}

export type CastBallotsResult =
  | { ok: true; ballots: number }
  | {
      ok: false;
      reason: 'closed' | 'consumed' | 'nothing-to-vote' | 'duplicate';
    };

/**
 * Consumes the confirmation and stores one ballot per apartment that has not
 * voted, in one transaction. The unique key on (voting, apartment) rejects a
 * concurrent duplicate, which rolls everything back.
 */
export async function castBallots(
  input: CastBallotsInput
): Promise<CastBallotsResult> {
  const { votingId, hoaId, userId, answers, now } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      const voting = await tx.voting.findUnique({
        where: { id: votingId },
        select: { status: true, endsAt: true },
      });

      if (!voting || !isVotingOpen(voting, now)) {
        return { ok: false, reason: 'closed' } as const;
      }

      const consumed = await tx.votingConfirmation.deleteMany({
        where: { id: input.confirmationId },
      });

      if (consumed.count === 0) {
        return { ok: false, reason: 'consumed' } as const;
      }

      const apartments = await tx.apartment.findMany({
        where: {
          userId,
          homeownersAssociationId: hoaId,
          isActive: true,
          votingBallots: { none: { votingId } },
        },
        select: { id: true },
      });

      if (apartments.length === 0) {
        return { ok: false, reason: 'nothing-to-vote' } as const;
      }

      for (const apartment of apartments) {
        await tx.votingBallot.create({
          data: {
            votingId,
            userId,
            apartmentId: apartment.id,
            votes: {
              create: Object.entries(answers).map(([questionId, choice]) => ({
                questionId,
                choice,
              })),
            },
          },
        });
      }

      return { ok: true, ballots: apartments.length } as const;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return { ok: false, reason: 'duplicate' };
    }

    throw error;
  }
}
