import { findMonthlyChargeSums } from '@/lib/queries/payments/find-monthly-charge-sums';
import {
  applyDerivedFigures,
  type DerivedPayment,
  type PaymentFiguresSource,
} from '@/lib/utils/payment-balances';
import { yearStartPeriod } from '@/lib/utils/period';

type ApartmentWithPayments = { id: string; payments: PaymentFiguresSource[] };

export type WithDerivedPayments<A extends ApartmentWithPayments> = Omit<
  A,
  'payments'
> & { payments: DerivedPayment<A['payments'][number]>[] };

/**
 * Replaces the payments of each apartment with figures derived from its charge
 * records, loading all needed charge sums in one query.
 */
export async function deriveApartmentPayments<A extends ApartmentWithPayments>(
  apartments: A[],
  maxPeriod: string
): Promise<WithDerivedPayments<A>[]> {
  const withPayments = apartments.filter(({ payments }) => payments.length > 0);
  const years = withPayments.flatMap(({ payments }) =>
    payments.map(({ year }) => year)
  );
  const chargeSums = await findMonthlyChargeSums(
    withPayments.map(({ id }) => id),
    {
      fromPeriod:
        years.length > 0 ? yearStartPeriod(Math.min(...years)) : undefined,
      toPeriod: maxPeriod,
    }
  );

  return apartments.map((apartment) => ({
    ...apartment,
    payments: apartment.payments.map((payment) =>
      applyDerivedFigures(payment, chargeSums.get(apartment.id), maxPeriod)
    ),
  }));
}
