import { monthIndexToPeriod } from '@/lib/utils/period';

const FIRST_MONTH_INDEX = 0;

export function getHistoryStartYear(now: Date, yearsBack: number): number {
  return now.getFullYear() - yearsBack;
}

export function chargesFromYear(startYear: number) {
  return { period: { gte: monthIndexToPeriod(startYear, FIRST_MONTH_INDEX) } };
}

export function chargesInWindow(
  startYear: number,
  cutoffPeriod: string | null
) {
  return {
    period: {
      ...chargesFromYear(startYear).period,
      ...(cutoffPeriod ? { lte: cutoffPeriod } : {}),
    },
  };
}

export function paymentsFromYear(startYear: number) {
  return { year: { gte: startYear } };
}
