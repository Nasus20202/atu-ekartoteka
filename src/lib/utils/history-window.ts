import { yearStartPeriod } from '@/lib/utils/period';

export function getHistoryStartYear(now: Date, yearsBack: number): number {
  return now.getFullYear() - yearsBack;
}

export function chargesFromYear(startYear: number) {
  return { period: { gte: yearStartPeriod(startYear) } };
}

export function chargesInWindow(startYear: number, cutoffPeriod: string) {
  return {
    period: {
      ...chargesFromYear(startYear).period,
      lte: cutoffPeriod,
    },
  };
}

export function paymentsFromYear(startYear: number) {
  return { year: { gte: startYear } };
}
