import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';
import { buildAssociationStatsRows } from '@/lib/admin/rules/association-stats-rows';
import { prisma } from '@/lib/platform/database/prisma';

/**
 * Per-association totals, ordered by name like the other association lists.
 * A fixed set of queries: the database groups per association or per apartment,
 * and the groups are combined per association in `buildAssociationStatsRows`.
 */
export async function getAssociationStats(): Promise<AssociationStatsDto[]> {
  const [
    associations,
    apartmentCounts,
    apartments,
    charges,
    notifications,
    payments,
    utilitySettlements,
    annualSettlements,
  ] = await Promise.all([
    prisma.homeownersAssociation.findMany({
      select: {
        id: true,
        name: true,
        apartmentsDataDate: true,
        chargesDataDate: true,
        notificationsDataDate: true,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    }),
    prisma.apartment.groupBy({
      by: ['homeownersAssociationId'],
      _count: { _all: true },
    }),
    prisma.apartment.findMany({
      select: { id: true, homeownersAssociationId: true },
    }),
    prisma.charge.groupBy({
      by: ['apartmentId'],
      _count: { _all: true },
      _max: { period: true },
    }),
    prisma.chargeNotification.groupBy({
      by: ['apartmentId'],
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ['apartmentId'],
      _count: { _all: true },
    }),
    prisma.utilitySettlement.groupBy({
      by: ['apartmentId'],
      _count: { _all: true },
    }),
    prisma.annualCostSettlement.groupBy({
      by: ['apartmentId'],
      _count: { _all: true },
    }),
  ]);

  return buildAssociationStatsRows({
    associations,
    apartmentCounts: apartmentCounts.map((group) => ({
      homeownersAssociationId: group.homeownersAssociationId,
      count: group._count._all,
    })),
    apartments,
    charges: charges.map((group) => ({
      apartmentId: group.apartmentId,
      count: group._count._all,
      lastPeriod: group._max.period,
    })),
    notifications: countsByApartment(notifications),
    payments: countsByApartment(payments),
    utilitySettlements: countsByApartment(utilitySettlements),
    annualSettlements: countsByApartment(annualSettlements),
  });
}

function countsByApartment(
  groups: { apartmentId: string; _count: { _all: number } }[]
) {
  return groups.map((group) => ({
    apartmentId: group.apartmentId,
    count: group._count._all,
  }));
}
