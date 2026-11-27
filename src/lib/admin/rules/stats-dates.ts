const PERIOD_YEAR_LENGTH = 4;
const PERIOD_LENGTH = 6;
const FIRST_DAY_OF_MONTH = 1;

/** A timestamp as an ISO string, or null when there is none. */
export function isoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/** A "YYYYMM" charge period as the first day of that month (UTC), ISO string. */
export function periodToIsoMonth(period: string | null): string | null {
  if (!period || period.length !== PERIOD_LENGTH) return null;

  const year = Number(period.slice(0, PERIOD_YEAR_LENGTH));
  const monthIndex = Number(period.slice(PERIOD_YEAR_LENGTH)) - 1;
  return new Date(Date.UTC(year, monthIndex, FIRST_DAY_OF_MONTH)).toISOString();
}
