import { prisma } from '@/lib/platform/database/prisma';
import type {
  ChargeRow,
  CommunityCharges,
} from '@/lib/settlements/types/stored-data';
import { toDecimal } from '@/lib/shared/utils/decimal';
import { yearEndPeriod, yearStartPeriod } from '@/lib/shared/utils/period';

export function findApartmentCharges(
  apartmentId: string,
  periods: string[]
): Promise<ChargeRow[]> {
  return prisma.charge.findMany({
    where: { apartmentId, period: { in: periods } },
    select: {
      period: true,
      description: true,
      quantity: true,
      unitPrice: true,
      totalAmount: true,
    },
  });
}

/** Charges of every description of a homeowners association in one year. */
export async function findCommunityCharges(
  homeownersAssociationId: string,
  year: number
): Promise<CommunityCharges[]> {
  const apartment = { homeownersAssociationId };
  const [totals, allocations] = await Promise.all([
    prisma.charge.groupBy({
      by: ['description'],
      where: {
        apartment,
        period: { gte: yearStartPeriod(year), lte: yearEndPeriod(year) },
      },
      _sum: { totalAmount: true },
    }),
    prisma.charge.groupBy({
      by: ['description'],
      where: { apartment, period: yearEndPeriod(year), unitPrice: 1 },
    }),
  ]);
  const allocated = new Set(allocations.map((a) => a.description));

  return totals.map(({ description, _sum }) => ({
    description,
    total: toDecimal(_sum.totalAmount ?? 0),
    allocated: allocated.has(description),
  }));
}
