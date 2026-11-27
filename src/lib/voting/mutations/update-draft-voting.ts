import { prisma } from '@/lib/platform/database/prisma';
import { changesBallotContent } from '@/lib/voting/rules/draft-lock';
import { type VotingInput, VotingStatus } from '@/lib/voting/types/voting';

export type UpdateDraftResult = 'updated' | 'not-draft' | 'locked';

/**
 * Replaces a draft and its questions. With ballots entered, the association, the
 * questions and the accepted answers are locked and the questions are kept.
 */
export function updateDraftVoting(
  id: string,
  input: VotingInput
): Promise<UpdateDraftResult> {
  return prisma.$transaction(async (tx) => {
    // Locks the row, so that no ballot is entered while the draft changes
    const locked = await tx.voting.updateMany({
      where: { id, status: VotingStatus.DRAFT },
      data: { updatedAt: new Date() },
    });
    if (locked.count === 0) return 'not-draft';

    const current = await tx.voting.findUniqueOrThrow({
      where: { id },
      select: {
        hoaId: true,
        allowAbstain: true,
        questions: { orderBy: { position: 'asc' }, select: { text: true } },
        _count: { select: { ballots: true } },
      },
    });
    const hasBallots = current._count.ballots > 0;
    if (hasBallots && changesBallotContent(current, input)) return 'locked';

    await tx.voting.update({
      where: { id },
      data: {
        hoaId: input.hoaId,
        title: input.title,
        description: input.description,
        endsAt: input.endsAt,
        allowAbstain: input.allowAbstain,
      },
    });
    if (hasBallots) return 'updated';

    await tx.votingQuestion.deleteMany({ where: { votingId: id } });
    await tx.votingQuestion.createMany({
      data: input.questions.map((question, position) => ({
        votingId: id,
        position,
        text: question.text,
      })),
    });

    return 'updated';
  });
}
