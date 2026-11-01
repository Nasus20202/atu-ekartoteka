import { prisma } from '@/lib/database/prisma';
import { type Decimal, toDecimal } from '@/lib/utils/decimal';
import { PAYMENT_MONTH_FIELD_KEYS } from '@/lib/utils/payment-months';
import { yearEndPeriod, yearStartPeriod } from '@/lib/utils/period';

const PAYMENT_SUM_SELECT = {
  openingBalance: true,
  ...Object.fromEntries(PAYMENT_MONTH_FIELD_KEYS.map((key) => [key, true])),
} as Record<'openingBalance' | (typeof PAYMENT_MONTH_FIELD_KEYS)[number], true>;

/**
 * Total derived closing balance of the given apartments, each for its own
 * payment year: opening balance plus payments minus charge records, counting
 * charges up to `maxPeriod`.
 */
export async function findDerivedClosingTotal(
  apartmentsByYear: Map<number, string[]>,
  maxPeriod: string
): Promise<Decimal> {
  if (apartmentsByYear.size === 0) {
    return toDecimal(0);
  }

  const years = Array.from(apartmentsByYear);
  const [paymentAggregate, chargeAggregate] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        OR: years.map(([year, apartmentIds]) => ({
          year,
          apartmentId: { in: apartmentIds },
        })),
      },
      _sum: PAYMENT_SUM_SELECT,
    }),
    prisma.charge.aggregate({
      where: {
        OR: years.map(([year, apartmentIds]) => {
          const yearEnd = yearEndPeriod(year);
          return {
            apartmentId: { in: apartmentIds },
            period: {
              gte: yearStartPeriod(year),
              lte: yearEnd < maxPeriod ? yearEnd : maxPeriod,
            },
          };
        }),
      },
      _sum: { totalAmount: true },
    }),
  ]);

  const received = Object.values(paymentAggregate._sum).reduce<Decimal>(
    (sum, value) => sum.plus(toDecimal(value ?? 0)),
    toDecimal(0)
  );

  return received.minus(toDecimal(chargeAggregate._sum.totalAmount ?? 0));
}
