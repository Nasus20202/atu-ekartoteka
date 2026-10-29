import type { findUserWithApartments } from '@/lib/queries/users/find-user-with-apartments';
import { toDecimal } from '@/lib/utils/decimal';
import { sumDecimals } from '@/lib/utils/sum';

type DashboardUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithApartments>>
>;
type DashboardApartment = DashboardUser['apartments'][number];

export type HoaPaymentGroup = {
  hoaId: string;
  hoaName: string;
  totalClosingBalance: ReturnType<typeof sumDecimals>;
};

function toPeriod(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getDashboardPeriods(now: Date) {
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  return {
    currentPeriod: toPeriod(now),
    previousPeriod: toPeriod(prevMonth),
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
      apartmentAddress: `${apt.address} ${apt.building || ''}/${apt.number}`
        .replace(/\s+\//g, ' /')
        .trim(),
      hoaId: apt.homeownersAssociation?.id ?? null,
      hoaName: apt.homeownersAssociation?.name ?? null,
      hoaHeader: apt.homeownersAssociation?.header ?? null,
    }))
  );
}

export function buildHoaPaymentGroups(
  apartments: DashboardApartment[]
): HoaPaymentGroup[] {
  const hoaPaymentMap = new Map<string, HoaPaymentGroup>();

  for (const apt of apartments) {
    if (apt.payments.length === 0) continue;
    const hoa = apt.homeownersAssociation;
    if (!hoa?.id) continue;
    const existing = hoaPaymentMap.get(hoa.id);
    const balance = apt.payments[0].closingBalance;
    if (existing) {
      existing.totalClosingBalance = existing.totalClosingBalance.plus(balance);
    } else {
      hoaPaymentMap.set(hoa.id, {
        hoaId: hoa.id,
        hoaName: hoa.name,
        totalClosingBalance: balance,
      });
    }
  }

  return Array.from(hoaPaymentMap.values());
}
