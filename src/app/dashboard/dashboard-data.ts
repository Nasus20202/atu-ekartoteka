import { getBalanceHistory } from '@/components/charts/balance-history-data';
import { getSeriesColor } from '@/components/charts/chart-colors';
import type { ApartmentBalance } from '@/components/dashboard/payments-summary-card';
import type { findUserWithApartments } from '@/lib/queries/users/find-user-with-apartments';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import { getPaymentYearHref } from '@/lib/utils/dashboard-links';
import { toDecimal } from '@/lib/utils/decimal';
import { dateToPeriod } from '@/lib/utils/period';

type DashboardUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithApartments>>
>;
type DashboardApartment = DashboardUser['apartments'][number];

export function getDashboardPeriods(now: Date) {
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  return {
    currentPeriod: dateToPeriod(now),
    previousPeriod: dateToPeriod(prevMonth),
  };
}

export function getChargesForPeriod(
  apartments: DashboardApartment[],
  period: string
) {
  return apartments.flatMap((apt) =>
    apt.charges.filter((charge) => charge.period === period)
  );
}

export function buildDashboardNotifications(apartments: DashboardApartment[]) {
  return apartments.flatMap((apt) =>
    apt.chargeNotifications.map((n) => ({
      ...n,
      quantity: toDecimal(n.quantity).toString(),
      unitPrice: toDecimal(n.unitPrice).toString(),
      totalAmount: toDecimal(n.totalAmount).toString(),
      apartmentNumber: apt.number,
      apartmentAddress: formatApartmentLabel(apt)
        .replace(/\s+\//g, ' /')
        .trim(),
      hoaId: apt.homeownersAssociation?.id ?? null,
      hoaName: apt.homeownersAssociation?.name ?? null,
      hoaHeader: apt.homeownersAssociation?.header ?? null,
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
        closingBalance: toDecimal(latestPayment.closingBalance),
        href: getPaymentYearHref(apt.id, latestPayment.year),
        color: getSeriesColor(index),
        history: getBalanceHistory(apt.payments, endPeriod),
      },
    ];
  });
}
