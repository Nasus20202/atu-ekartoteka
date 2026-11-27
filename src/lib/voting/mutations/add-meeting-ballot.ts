import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/platform/database/prisma';
import { type VoteAnswers, VotingStatus } from '@/lib/voting/types/voting';

interface Input {
  votingId: string;
  /** When the draft was read; a later change rejects the ballot */
  readAt: Date;
  hoaId: string;
  apartmentId: string;
  answers: VoteAnswers;
}

export type AddMeetingBallotResult =
  | { ok: true; ballotId: string }
  | { ok: false; reason: 'changed' | 'unknown-apartment' | 'duplicate' };

/** Stores the ballot an apartment cast at a meeting, in an unchanged draft. */
export async function addMeetingBallot({
  votingId,
  readAt,
  hoaId,
  apartmentId,
  answers,
}: Input): Promise<AddMeetingBallotResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const unchanged = await tx.voting.updateMany({
        where: {
          id: votingId,
          status: VotingStatus.DRAFT,
          updatedAt: readAt,
        },
        data: { updatedAt: new Date() },
      });
      if (unchanged.count === 0) {
        return { ok: false, reason: 'changed' } as const;
      }

      const apartment = await tx.apartment.findFirst({
        where: {
          id: apartmentId,
          homeownersAssociationId: hoaId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!apartment) {
        return { ok: false, reason: 'unknown-apartment' } as const;
      }

      const ballot = await tx.votingBallot.create({
        data: {
          votingId,
          apartmentId,
          votes: {
            create: Object.entries(answers).map(([questionId, choice]) => ({
              questionId,
              choice,
            })),
          },
        },
        select: { id: true },
      });

      return { ok: true, ballotId: ballot.id } as const;
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
