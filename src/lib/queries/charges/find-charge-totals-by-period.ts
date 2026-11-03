import { prisma } from '@/lib/database/prisma';
import { type Decimal, toDecimal } from '@/lib/utils/decimal';
import { chargesFromYear } from '@/lib/utils/history-window';

export type PeriodChargeTotal = { count: number; total: Decimal };
export type ChargeTotalsByPeriod = Map<string, PeriodChargeTotal>;

/**
 * Number of charge lines and their total for each requested period across all
 * apartments of the user. Counting and summing happen in the database; periods
 * without charges are absent from the map.
 */
export async function findChargeTotalsByPeriod(
  userId: string,
  startYear: number,
  periods: string[]
): Promise<ChargeTotalsByPeriod> {
  const rows = await prisma.charge.groupBy({
    by: ['period'],
    where: {
      apartment: { userId },
      period: { ...chargesFromYear(startYear).period, in: periods },
    },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });

  return new Map(
    rows.map((row) => [
      row.period,
      {
        count: row._count._all,
        total: toDecimal(row._sum.totalAmount ?? 0),
      },
    ])
  );
}
