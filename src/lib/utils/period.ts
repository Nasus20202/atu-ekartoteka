// Periods are "YYYYMM" strings
const PERIOD_YEAR_LENGTH = 4;
const PERIOD_LENGTH = 6;
const FIRST_MONTH_INDEX = 0;
const LAST_MONTH_INDEX = 11;

export function monthIndexToPeriod(year: number, monthIndex: number): string {
  const month = String(monthIndex + 1).padStart(2, '0');
  return `${year}${month}`;
}

export function yearStartPeriod(year: number): string {
  return monthIndexToPeriod(year, FIRST_MONTH_INDEX);
}

export function yearEndPeriod(year: number): string {
  return monthIndexToPeriod(year, LAST_MONTH_INDEX);
}

export function dateToPeriod(date: Date): string {
  return monthIndexToPeriod(date.getFullYear(), date.getMonth());
}

export function periodToDate(period: string): Date {
  const year = Number.parseInt(period.slice(0, PERIOD_YEAR_LENGTH), 10);
  const month =
    Number.parseInt(period.slice(PERIOD_YEAR_LENGTH, PERIOD_LENGTH), 10) - 1;

  return new Date(year, month, 1);
}

export function getPeriodsBetween(
  startPeriod: string,
  endPeriod: string
): string[] {
  const periods: string[] = [];
  const cursor = periodToDate(startPeriod);
  const end = periodToDate(endPeriod);

  while (cursor <= end) {
    periods.push(dateToPeriod(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return periods;
}
