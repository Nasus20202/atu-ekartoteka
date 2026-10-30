import { getSeriesColor } from '@/components/charts/chart-colors';
import { Prisma } from '@/generated/prisma/browser';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';
import { formatPeriod, MONTH_NAMES_PL } from '@/lib/utils';
import {
  formatApartmentLabel,
  type LabelledApartment,
} from '@/lib/utils/apartment-label';
import { type Decimal, type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { getNonEmptyMonths } from '@/lib/utils/payment-months';
import { getPeriodsBetween } from '@/lib/utils/period';

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

// Colors come from the apartment's position in the list, so they match the
// balance chart even when some apartments have no charges.
export function getChargeTrendByApartment(
  apartments: ApartmentChargesLike[],
  endPeriod: string
): ChargeTrendResult {
  const totalsByPeriod = new Map<string, Map<ChargeTrendKey, Decimal>>();
  const apartmentsByKey = new Map<
    ChargeTrendKey,
    { label: string; apartmentId: string; color: string }
  >();

  apartments.forEach((apartment, apartmentIndex) => {
    const seriesKey = toSeriesKey(apartment.id);

    for (const charge of apartment.charges) {
      const amount = toDecimal(charge.totalAmount);

      if (amount.isZero()) {
        continue;
      }

      apartmentsByKey.set(seriesKey, {
        label: formatApartmentLabel(apartment),
        apartmentId: apartment.id,
        color: getSeriesColor(apartmentIndex),
      });

      const periodTotals =
        totalsByPeriod.get(charge.period) ?? new Map<ChargeTrendKey, Decimal>();
      const current = periodTotals.get(seriesKey) ?? new Prisma.Decimal(0);
      periodTotals.set(seriesKey, current.plus(amount));
      totalsByPeriod.set(charge.period, periodTotals);
    }
  });

  const firstPeriod = Array.from(totalsByPeriod.keys()).sort()[0];

  if (!firstPeriod) {
    return { data: [], series: [] };
  }

  const periods = getPeriodsBetween(
    firstPeriod,
    endPeriod > firstPeriod ? endPeriod : firstPeriod
  );

  const series = Array.from(apartmentsByKey.entries()).map(
    ([key, apartment]) => ({ key, ...apartment })
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
