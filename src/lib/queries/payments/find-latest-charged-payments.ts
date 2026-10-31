import { prisma } from '@/lib/database/prisma';
import { CHARGE_MONTH_FIELD_KEYS } from '@/lib/utils/payment-months';

type ChargeMonthKey = (typeof CHARGE_MONTH_FIELD_KEYS)[number];

const CHARGE_MONTH_SELECT = Object.fromEntries(
  CHARGE_MONTH_FIELD_KEYS.map((key) => [key, true])
) as Record<ChargeMonthKey, true>;

// One row per apartment: its newest payment year that has any charge.
export function findLatestChargedPayments(apartmentIds: string[]) {
  return prisma.payment.findMany({
    where: {
      apartmentId: { in: apartmentIds },
      OR: CHARGE_MONTH_FIELD_KEYS.map((key) => ({ [key]: { not: 0 } })),
    },
    distinct: ['apartmentId'],
    orderBy: { year: 'desc' },
    select: { year: true, ...CHARGE_MONTH_SELECT },
  });
}
