import { Prisma } from '@/generated/prisma/browser';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';
import { formatPeriod, MONTH_NAMES_PL } from '@/lib/utils';
import {
  formatApartmentLabel,
  type LabelledApartment,
} from '@/lib/utils/apartment-label';
import { type Decimal, type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { getNonEmptyMonths } from '@/lib/utils/payment-months';

export type PaymentMonthlyChartDatum = {
  monthIndex: number;
  label: string;
  payments: number;
  charges: number;
  balance: number;
};

export type ChargeTrendSeries = {
  key: string;
  label: string;
  color: string;
  apartmentId: string;
};

export type ChargeTrendDatum = {
  period: string;
  label: string;
} & Record<`apt_${string}`, number>;

type ChargeTrendKey = `apt_${string}`;

type ChargeTrendSource = {
  period: string;
  totalAmount: DecimalLike;
};

type ApartmentChargesLike = LabelledApartment & {
  id: string;
  charges: ChargeTrendSource[];
};

export type ChargeTrendResult = {
  data: ChargeTrendDatum[];
  series: ChargeTrendSeries[];
};

export const SERIES_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(173 58% 39%)',
  'hsl(35 92% 50%)',
  'hsl(262 83% 58%)',
  'hsl(199 89% 48%)',
] as const;

function toPeriodDate(period: string): Date {
  const year = Number.parseInt(period.slice(0, 4), 10);
  const month = Number.parseInt(period.slice(4, 6), 10) - 1;

  return new Date(year, month, 1);
}

function toPeriodKey(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getPeriodsBetween(
  startPeriod: string,
  endPeriod: string
): string[] {
  const periods: string[] = [];
  const cursor = toPeriodDate(startPeriod);
  const end = toPeriodDate(endPeriod);

  while (cursor <= end) {
    periods.push(toPeriodKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return periods;
}

function toSeriesKey(apartmentId: string): ChargeTrendKey {
  return `apt_${apartmentId.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

export function toChartNumber(value: DecimalLike): number {
  return Number(toDecimal(value).toFixed(4));
}

export function getPaymentMonthlyChartData(
  payment: PaymentDtoSource
): PaymentMonthlyChartDatum[] {
  let runningBalance = toDecimal(payment.openingBalance);

  return getNonEmptyMonths(payment).map((month) => {
    runningBalance = runningBalance.plus(month.payments).minus(month.charges);

    return {
      monthIndex: month.monthIndex,
      label: MONTH_NAMES_PL[month.monthIndex],
      payments: toChartNumber(month.payments),
      charges: toChartNumber(month.charges),
      balance: toChartNumber(runningBalance),
    };
  });
}

// Series follow the apartments' order, so colors match the balance chart.
export function getChargeTrendByApartment(
  apartments: ApartmentChargesLike[],
  endPeriod: string
): ChargeTrendResult {
  const totalsByPeriod = new Map<string, Map<ChargeTrendKey, Decimal>>();
  const apartmentsByKey = new Map<
    ChargeTrendKey,
    { label: string; apartmentId: string }
  >();

  for (const apartment of apartments) {
    const seriesKey = toSeriesKey(apartment.id);

    for (const charge of apartment.charges) {
      const amount = toDecimal(charge.totalAmount);

      if (amount.isZero()) {
        continue;
      }

      apartmentsByKey.set(seriesKey, {
        label: formatApartmentLabel(apartment),
        apartmentId: apartment.id,
      });

      const periodTotals =
        totalsByPeriod.get(charge.period) ?? new Map<ChargeTrendKey, Decimal>();
      const current = periodTotals.get(seriesKey) ?? new Prisma.Decimal(0);
      periodTotals.set(seriesKey, current.plus(amount));
      totalsByPeriod.set(charge.period, periodTotals);
    }
  }

  const firstPeriod = Array.from(totalsByPeriod.keys()).sort()[0];

  if (!firstPeriod) {
    return { data: [], series: [] };
  }

  const periods = getPeriodsBetween(
    firstPeriod,
    endPeriod > firstPeriod ? endPeriod : firstPeriod
  );

  const series = Array.from(apartmentsByKey.entries()).map(
    ([key, apartment], index) => ({
      key,
      ...apartment,
      color: SERIES_COLORS[index % SERIES_COLORS.length],
    })
  );

  const data = periods.map((period) => {
    const periodTotals = totalsByPeriod.get(period);
    const datum: ChargeTrendDatum = {
      period,
      label: formatPeriod(period),
    };

    for (const entry of series) {
      datum[entry.key as ChargeTrendKey] = toChartNumber(
        periodTotals?.get(entry.key) ?? new Prisma.Decimal(0)
      );
    }

    return datum;
  });

  return { data, series };
}
