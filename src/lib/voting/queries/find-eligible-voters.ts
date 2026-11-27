import { AccountStatus } from '@/lib/auth/types/account';
import { prisma } from '@/lib/platform/database/prisma';

/** Approved users who own an active apartment of the HOA, with those apartments. */
export function findEligibleVoters(hoaId: string, votingId: string) {
  const ownedInHoa = { homeownersAssociationId: hoaId, isActive: true };

  return prisma.user.findMany({
    where: {
      status: AccountStatus.APPROVED,
      apartments: { some: ownedInHoa },
    },
    orderBy: [{ name: { sort: 'asc', nulls: 'last' } }, { email: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      apartments: {
        where: ownedInHoa,
        orderBy: [{ address: 'asc' }, { building: 'asc' }, { number: 'asc' }],
        select: {
          id: true,
          owner: true,
          address: true,
          building: true,
          number: true,
          votingBallots: { where: { votingId }, select: { id: true } },
        },
      },
    },
  });
}

/** The ids among `userIds` that are eligible voters of the HOA, with their address. */
export function findEligibleRecipients(hoaId: string, userIds: string[]) {
  return prisma.user.findMany({
    where: {
      id: { in: userIds },
      status: AccountStatus.APPROVED,
      apartments: {
        some: { homeownersAssociationId: hoaId, isActive: true },
      },
    },
    select: { id: true, name: true, email: true },
  });
}
