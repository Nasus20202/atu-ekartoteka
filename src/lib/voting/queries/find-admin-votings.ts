import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/platform/database/prisma';
import type { SortDirection } from '@/lib/shared/utils/sort';
import {
  ALL_VOTINGS,
  type VotingListQuery,
  type VotingSortKey,
} from '@/lib/voting/rules/voting-list-query';

const ADMIN_LIST_LIMIT = 200;

type Order = Prisma.VotingOrderByWithRelationInput;

const ORDER_BY: Record<VotingSortKey, (direction: SortDirection) => Order> = {
  title: (direction) => ({ title: direction }),
  hoa: (direction) => ({ hoa: { name: direction } }),
  status: (direction) => ({ status: direction }),
  questions: (direction) => ({ questions: { _count: direction } }),
  ballots: (direction) => ({ ballots: { _count: direction } }),
  // A voting without a deadline comes after every dated one
  endsAt: (direction) => ({ endsAt: { sort: direction, nulls: 'last' } }),
  createdAt: (direction) => ({ createdAt: direction }),
};

export function findAdminVotings({
  hoaId,
  status,
  sort,
}: VotingListQuery = ALL_VOTINGS) {
  return prisma.voting.findMany({
    where: { ...(hoaId && { hoaId }), ...(status && { status }) },
    // The tie-break keeps equal values newest first
    orderBy: [
      ORDER_BY[sort.key](sort.direction),
      ...(sort.key === 'createdAt' ? [] : [{ createdAt: 'desc' as const }]),
      { id: 'asc' },
    ],
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
