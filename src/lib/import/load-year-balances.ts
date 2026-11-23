import {
  type BalancePaymentSource,
  buildYearBalanceRows,
  type YearBalanceSummary,
} from '@/lib/import/year-balance-overview';
import { findMonthlyChargeSums } from '@/lib/payments/queries/find-monthly-charge-sums';

/** Builds the year balances of an HOA from its already loaded payment rows. */
export async function loadYearBalances(
  payments: BalancePaymentSource[]
): Promise<YearBalanceSummary[]> {
  const chargeSums = await findMonthlyChargeSums([
    ...new Set(payments.map(({ apartmentId }) => apartmentId)),
  ]);

  return buildYearBalanceRows(payments, chargeSums);
}
