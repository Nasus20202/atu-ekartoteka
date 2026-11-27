import { prisma } from '@/lib/platform/database/prisma';
import { TENANT_VISIBLE_STATUSES } from '@/lib/voting/rules/voting-status';

/**
 * Votings a tenant may see: visible statuses in HOAs where they own an active
 * apartment, with the counts needed to tell whether they still have to vote.
 */
export function findTenantVotings(
  userId: string,
  statuses = TENANT_VISIBLE_STATUSES
) {
  const owned = { userId, isActive: true };

  return prisma.voting.findMany({
    where: {
      status: { in: statuses },
      hoa: { apartments: { some: owned } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    select: {
      id: true,
      title: true,
      status: true,
      endsAt: true,
      hoa: {
        select: {
          name: true,
          _count: { select: { apartments: { where: owned } } },
        },
      },
      _count: { select: { questions: true, ballots: { where: { userId } } } },
    },
  });
}

/** One visible voting of the user, or null: hides drafts, archives and foreign HOAs alike. */
export function findTenantVoting(userId: string, votingId: string) {
  return prisma.voting.findFirst({
    where: {
      id: votingId,
      status: { in: TENANT_VISIBLE_STATUSES },
      hoa: { apartments: { some: { userId, isActive: true } } },
    },
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
