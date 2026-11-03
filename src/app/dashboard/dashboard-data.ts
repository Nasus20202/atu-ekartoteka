import { getBalanceHistory } from '@/components/charts/balance-history-data';
import { getSeriesColor } from '@/components/charts/chart-colors';
import type { ApartmentBalance } from '@/components/dashboard/payments-summary-card';
import type {
  ChargeTotalsByPeriod,
  PeriodChargeTotal,
} from '@/lib/queries/charges/find-charge-totals-by-period';
import type { MonthlyChargeSums } from '@/lib/queries/payments/find-monthly-charge-sums';
import type { findUserWithApartments } from '@/lib/queries/users/find-user-with-apartments';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import { getPaymentYearHref } from '@/lib/utils/dashboard-links';
import { toDecimal } from '@/lib/utils/decimal';
import { dateToPeriod, periodToDate } from '@/lib/utils/period';

type DashboardUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithApartments>>
>;
type DashboardApartment = DashboardUser['apartments'][number];

export function getDashboardPeriods(now: Date) {
  const currentPeriod = dateToPeriod(now);
  const prevMonth = periodToDate(currentPeriod);
  prevMonth.setMonth(prevMonth.getMonth() - 1);

  return { currentPeriod, previousPeriod: dateToPeriod(prevMonth) };
}

export function getPeriodTotal(
  totals: ChargeTotalsByPeriod,
  period: string
): PeriodChargeTotal {
  return totals.get(period) ?? { count: 0, total: toDecimal(0) };
}

// Trend input: each apartment's monthly charge sums, as charge-like rows.
export function withMonthlyCharges(
  apartments: DashboardApartment[],
  monthlyCharges: MonthlyChargeSums
) {
  return apartments.map((apartment) => ({
    ...apartment,
    charges: Array.from(
      monthlyCharges.get(apartment.id) ?? [],
      ([period, totalAmount]) => ({ period, totalAmount })
    ),
  }));
}

export function buildDashboardNotifications(apartments: DashboardApartment[]) {
  return apartments.flatMap((apt) =>
    apt.chargeNotifications.map((n) => ({
      ...n,
      quantity: toDecimal(n.quantity).toString(),
      unitPrice: toDecimal(n.unitPrice).toString(),
      totalAmount: toDecimal(n.totalAmount).toString(),
      apartmentNumber: apt.number,
      apartmentAddress: formatApartmentLabel(apt),
      hoaId: apt.homeownersAssociation?.id ?? null,
      hoaName: apt.homeownersAssociation?.name ?? null,
      hoaHeader: apt.homeownersAssociation?.header ?? null,
      hoaFooter: apt.homeownersAssociation?.footer ?? null,
    }))
  );
}

export function buildApartmentBalances(
  apartments: DashboardApartment[],
  endPeriod: string
): ApartmentBalance[] {
  return apartments.flatMap((apt, index) => {
    const latestPayment = apt.payments[0];

    if (!latestPayment) {
      return [];
    }

    return [
      {
        apartmentId: apt.id,
        apartmentLabel: formatApartmentLabel(apt),
        hoaName: apt.homeownersAssociation?.name ?? null,
        closingBalance: toDecimal(latestPayment.calculatedClosingBalance),
        href: getPaymentYearHref(apt.id, latestPayment.year),
        color: getSeriesColor(index),
        history: getBalanceHistory(apt.payments, endPeriod),
      },
    ];
  });
}
