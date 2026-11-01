import { prisma } from '@/lib/database/prisma';
import { type Decimal, toDecimal } from '@/lib/utils/decimal';

export type ChargeSumsByPeriod = Map<string, Decimal>;
export type MonthlyChargeSums = Map<string, ChargeSumsByPeriod>;

type PeriodRange = { fromPeriod?: string; toPeriod?: string };
type ChargeClient = Pick<typeof prisma, 'charge'>;

// Monthly charge of each apartment: the sum of its charge records per period.
export async function findMonthlyChargeSums(
  apartmentIds: string[],
  { fromPeriod, toPeriod }: PeriodRange = {},
  client: ChargeClient = prisma
): Promise<MonthlyChargeSums> {
  const sums: MonthlyChargeSums = new Map();
  if (apartmentIds.length === 0) {
    return sums;
  }

  const rows = await client.charge.groupBy({
    by: ['apartmentId', 'period'],
    where: {
      apartmentId: { in: apartmentIds },
      period: {
        ...(fromPeriod ? { gte: fromPeriod } : {}),
        ...(toPeriod ? { lte: toPeriod } : {}),
      },
    },
    _sum: { totalAmount: true },
  });

  for (const { apartmentId, period, _sum } of rows) {
    const apartmentSums = sums.get(apartmentId) ?? new Map();
    apartmentSums.set(period, toDecimal(_sum.totalAmount ?? 0));
    sums.set(apartmentId, apartmentSums);
  }

  return sums;
}
