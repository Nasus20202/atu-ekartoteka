import { monthIndexToPeriod } from '@/lib/utils/period';

const FIRST_MONTH_INDEX = 0;

export function getHistoryStartYear(now: Date, yearsBack: number): number {
  return now.getFullYear() - yearsBack;
}

export function getHistoryStartPeriod(startYear: number): string {
  return monthIndexToPeriod(startYear, FIRST_MONTH_INDEX);
}
