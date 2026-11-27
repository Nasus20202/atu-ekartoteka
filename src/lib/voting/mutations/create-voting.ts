import { prisma } from '@/lib/platform/database/prisma';
import type { VotingInput } from '@/lib/voting/types/voting';

export function createVoting(input: VotingInput) {
  return prisma.voting.create({
    data: {
      hoaId: input.hoaId,
      title: input.title,
      description: input.description,
      endsAt: input.endsAt,
      allowAbstain: input.allowAbstain,
      questions: {
        create: input.questions.map((question, position) => ({
          position,
          text: question.text,
        })),
      },
    },
    select: { id: true },
  });
}
