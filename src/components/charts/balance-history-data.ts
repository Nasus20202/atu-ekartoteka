import { toChartNumber } from '@/components/charts/chart-data';
import { formatPeriod } from '@/lib/utils';
import { type Decimal, type DecimalLike, toDecimal } from '@/lib/utils/decimal';
import {
  getNonEmptyMonths,
  type PaymentMonthFieldsLike,
} from '@/lib/utils/payment-months';
import { getPeriodsBetween, monthIndexToPeriod } from '@/lib/utils/period';

export type BalanceHistoryDatum = {
  period: string;
  label: string;
  balance: number;
};

type BalanceSeriesKey = `apt_${number}`;

export type BalanceTrendDatum = {
  period: string;
  label: string;
} & Partial<Record<BalanceSeriesKey, number>>;

export type BalanceTrend = {
  data: BalanceTrendDatum[];
  series: Array<{
    key: BalanceSeriesKey;
    label: string;
    color: string;
    apartmentId: string;
  }>;
};

type LabeledBalanceHistory = {
  apartmentId: string;
  label: string;
  color: string;
  history: BalanceHistoryDatum[];
};

type BalancePaymentSource = PaymentMonthFieldsLike & {
  year: number;
  openingBalance: DecimalLike;
};

function getBalancePoints(
  payments: BalancePaymentSource[],
  endPeriod: string
): Map<string, Decimal> {
  const points = new Map<string, Decimal>();
  const sortedPayments = [...payments].sort(
    (left, right) => left.year - right.year
  );

  for (const payment of sortedPayments) {
    let runningBalance = toDecimal(payment.openingBalance);

    for (const month of getNonEmptyMonths(payment, endPeriod)) {
      runningBalance = runningBalance.plus(month.payments).minus(month.charges);
      points.set(
        monthIndexToPeriod(payment.year, month.monthIndex),
        runningBalance
      );
    }
  }

  return points;
}

// Months without activity keep the last known balance up to the end period.
export function getBalanceHistory(
  payments: BalancePaymentSource[],
  endPeriod: string
): BalanceHistoryDatum[] {
  const points = getBalancePoints(payments, endPeriod);
  const firstPeriod = Array.from(points.keys()).sort()[0];

  if (!firstPeriod) {
    return [];
  }

  let lastBalance = points.get(firstPeriod) as Decimal;

  return getPeriodsBetween(firstPeriod, endPeriod).map((period) => {
    lastBalance = points.get(period) ?? lastBalance;

    return {
      period,
      label: formatPeriod(period),
      balance: toChartNumber(lastBalance),
    };
  });
}

// Every history runs continuously up to the same end period, so merging only
// needs the earliest start; months before an apartment's first data stay empty.
export function mergeBalanceHistories(
  histories: LabeledBalanceHistory[]
): BalanceTrend {
  const withData = histories.filter((entry) => entry.history.length > 0);
  const firstPeriod = withData
    .map((entry) => entry.history[0].period)
    .sort()[0];
  const endPeriod = withData
    .map((entry) => entry.history.at(-1)!.period)
    .sort()
    .at(-1);

  if (!firstPeriod || !endPeriod) {
    return { data: [], series: [] };
  }

  const series = withData.map((entry, index) => ({
    key: `apt_${index}` as BalanceSeriesKey,
    label: entry.label,
    apartmentId: entry.apartmentId,
    color: entry.color,
  }));
  const balancesBySeries = withData.map(
    (entry) =>
      new Map(entry.history.map((datum) => [datum.period, datum.balance]))
  );

  const data = getPeriodsBetween(firstPeriod, endPeriod).map((period) => {
    const datum: BalanceTrendDatum = { period, label: formatPeriod(period) };

    series.forEach((entry, index) => {
      const balance = balancesBySeries[index].get(period);

      if (balance !== undefined) {
        datum[entry.key] = balance;
      }
    });

    return datum;
  });

  return { data, series };
}
