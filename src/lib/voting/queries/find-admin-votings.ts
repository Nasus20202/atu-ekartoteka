import { prisma } from '@/lib/platform/database/prisma';

const ADMIN_LIST_LIMIT = 200;

export function findAdminVotings() {
  return prisma.voting.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: ADMIN_LIST_LIMIT,
    select: {
      id: true,
      title: true,
      status: true,
      endsAt: true,
      createdAt: true,
      hoa: { select: { id: true, name: true } },
      _count: { select: { questions: true, ballots: true } },
    },
  });
}
