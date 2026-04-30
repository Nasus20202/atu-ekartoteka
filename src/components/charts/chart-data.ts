import { Prisma } from '@/generated/prisma/browser';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';
import { formatPeriod, MONTH_NAMES_PL } from '@/lib/utils';
import { type Decimal, type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { getNonEmptyMonths } from '@/lib/utils/payment-months';

export const DEFAULT_CHARGE_TREND_VIEWPORT_SIZE = 12;
export const DEFAULT_CHARGE_TREND_PERIOD_LIMIT =
  DEFAULT_CHARGE_TREND_VIEWPORT_SIZE;

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
};

export type ChargeTrendDatum = {
  period: string;
  label: string;
} & Record<`hoa_${string}`, number>;

type ChargeTrendKey = `hoa_${string}`;

type ChargeTrendSource = {
  period: string;
  totalAmount: DecimalLike;
};

type ApartmentChargesLike = {
  homeownersAssociation?: {
    id: string;
    name: string;
  } | null;
  charges: ChargeTrendSource[];
};

export type ChargeTrendResult = {
  data: ChargeTrendDatum[];
  series: ChargeTrendSeries[];
};

const HOA_TREND_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(173 58% 39%)',
  'hsl(35 92% 50%)',
  'hsl(262 83% 58%)',
  'hsl(199 89% 48%)',
] as const;

function getCurrentPeriod(): string {
  const now = new Date();

  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function toPeriodDate(period: string): Date {
  const year = Number.parseInt(period.slice(0, 4), 10);
  const month = Number.parseInt(period.slice(4, 6), 10) - 1;

  return new Date(year, month, 1);
}

function toPeriodKey(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getPeriodsBetween(startPeriod: string, endPeriod: string): string[] {
  const periods: string[] = [];
  const cursor = toPeriodDate(startPeriod);
  const end = toPeriodDate(endPeriod);

  while (cursor <= end) {
    periods.push(toPeriodKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return periods;
}

function toSeriesKey(hoaId: string): ChargeTrendKey {
  return `hoa_${hoaId.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

function toChartNumber(value: DecimalLike): number {
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

export function getChargeTrendByHoaHistory(
  apartments: ApartmentChargesLike[],
  endPeriod = getCurrentPeriod()
): ChargeTrendResult {
  const totalsByPeriod = new Map<string, Map<ChargeTrendKey, Decimal>>();
  const hoaLabelsByKey = new Map<ChargeTrendKey, string>();

  for (const apartment of apartments) {
    const hoa = apartment.homeownersAssociation;

    if (!hoa?.id) {
      continue;
    }

    const seriesKey = toSeriesKey(hoa.id);

    for (const charge of apartment.charges) {
      const amount = toDecimal(charge.totalAmount);

      if (amount.isZero()) {
        continue;
      }

      hoaLabelsByKey.set(seriesKey, hoa.name);

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

  const series = Array.from(hoaLabelsByKey.entries())
    .sort(([, leftLabel], [, rightLabel]) =>
      leftLabel.localeCompare(rightLabel, 'pl')
    )
    .map(([key, label], index) => ({
      key,
      label,
      color: HOA_TREND_COLORS[index % HOA_TREND_COLORS.length],
    }));

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

export const getRecentChargeTrendByHoa = getChargeTrendByHoaHistory;
