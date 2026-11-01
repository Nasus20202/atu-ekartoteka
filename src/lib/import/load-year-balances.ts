import { prisma } from '@/lib/database/prisma';
import {
  type BalancePaymentSource,
  buildYearBalanceRows,
  type YearBalanceSummary,
} from '@/lib/import/year-balance-overview';
import { findMonthlyChargeSums } from '@/lib/queries/payments/find-monthly-charge-sums';
import { PAYMENT_MONTH_FIELD_KEYS } from '@/lib/utils/payment-months';

const PAYMENT_MONTH_SELECT = Object.fromEntries(
  PAYMENT_MONTH_FIELD_KEYS.map((key) => [key, true])
) as Record<(typeof PAYMENT_MONTH_FIELD_KEYS)[number], true>;

const BALANCE_PAYMENT_SELECT = {
  apartmentId: true,
  year: true,
  openingBalance: true,
  ...PAYMENT_MONTH_SELECT,
} as const;

export async function loadYearBalances(
  hoaId: string
): Promise<YearBalanceSummary[]> {
  const rows = await prisma.payment.findMany({
    where: { apartment: { homeownersAssociationId: hoaId } },
    select: {
      ...BALANCE_PAYMENT_SELECT,
      apartment: {
        select: { externalApartmentId: true, externalOwnerId: true },
      },
    },
  });
  const payments: BalancePaymentSource[] = rows.map(
    ({ apartment, ...payment }) => ({
      ...payment,
      apartmentLabel: apartment.externalApartmentId,
      ownerId: apartment.externalOwnerId,
    })
  );
  const chargeSums = await findMonthlyChargeSums([
    ...new Set(payments.map(({ apartmentId }) => apartmentId)),
  ]);

  return buildYearBalanceRows(payments, chargeSums);
}
