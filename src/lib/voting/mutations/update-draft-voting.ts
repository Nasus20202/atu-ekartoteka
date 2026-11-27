import { prisma } from '@/lib/platform/database/prisma';
import { type VotingInput, VotingStatus } from '@/lib/voting/types/voting';

/** Replaces a draft and its questions; false when it is no longer a draft. */
export function updateDraftVoting(id: string, input: VotingInput) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.voting.updateMany({
      where: { id, status: VotingStatus.DRAFT },
      data: {
        hoaId: input.hoaId,
        title: input.title,
        description: input.description,
        endsAt: input.endsAt,
      },
    });

    if (updated.count === 0) return false;

    await tx.votingQuestion.deleteMany({ where: { votingId: id } });
    await tx.votingQuestion.createMany({
      data: input.questions.map((question, position) => ({
        votingId: id,
        position,
        text: question.text,
      })),
    });

    return true;
  });
}
