import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { CHARGE_MONTH_FIELD_KEYS } from '@/lib/utils/payment-months';
import { dateToPeriod, monthIndexToPeriod } from '@/lib/utils/period';

type CutoffPaymentSource = Partial<
  Record<(typeof CHARGE_MONTH_FIELD_KEYS)[number], DecimalLike>
> & { year: number };

/**
 * Latest period with a non-zero charge across the given payment records,
 * never later than the current month. Null when no month carries a charge.
 */
export function getChargeCutoffPeriod(
  payments: CutoffPaymentSource[],
  now: Date
): string | null {
  const periods = payments.flatMap((payment) =>
    CHARGE_MONTH_FIELD_KEYS.flatMap((key, monthIndex) =>
      toDecimal(payment[key] ?? 0).isZero()
        ? []
        : [monthIndexToPeriod(payment.year, monthIndex)]
    )
  );

  if (periods.length === 0) {
    return null;
  }

  return [periods.sort().at(-1) as string, dateToPeriod(now)].sort()[0];
}
