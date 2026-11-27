import { prisma } from '@/lib/platform/database/prisma';

export function findVotingById(id: string) {
  return prisma.voting.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      endsAt: true,
      hoa: { select: { id: true, name: true } },
      questions: {
        orderBy: { position: 'asc' },
        select: { id: true, position: true, text: true },
      },
    },
  });
}
