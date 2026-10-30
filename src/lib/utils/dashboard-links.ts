import { getPeriodYear } from '@/lib/utils/group-by-year';

function toMonthParam(period: string): string {
  const year = getPeriodYear(period);
  return `${year}-${period.slice(year.length)}`;
}

export function getChargesHref({
  apartmentId,
  period,
}: { apartmentId?: string; period?: string } = {}): string {
  const base = apartmentId
    ? `/dashboard/charges/${apartmentId}`
    : '/dashboard/charges';

  return period ? `${base}?month=${toMonthParam(period)}` : base;
}

export function getPaymentYearHref(
  apartmentId: string,
  year: number | string
): string {
  return `/dashboard/payments/${apartmentId}/${year}`;
}
