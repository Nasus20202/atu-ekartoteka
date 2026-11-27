import { formatDate, formatUtcDate } from '@/lib/shared/utils';
import { APP_LOCALE } from '@/lib/shared/utils/locale';

/** Shown for a value the database does not hold. */
export const EMPTY_VALUE = '—';

const RANGE_SEPARATOR = ' – ';

/** "01.2025": the month and year of a UTC date, as in the charge periods. */
const MONTH_YEAR_FORMAT: Intl.DateTimeFormatOptions = {
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
};

const countFormat = new Intl.NumberFormat(APP_LOCALE);

/** A count with Polish digit grouping: 12345 -> "12 345". */
export const formatCount = (count: number) => countFormat.format(count);

export const formatMonthYear = (iso: string) =>
  new Date(iso).toLocaleDateString(APP_LOCALE, MONTH_YEAR_FORMAT);

/** A calendar date stored at midnight UTC: "15.01.2025". */
export const formatDay = (iso: string) => formatUtcDate(new Date(iso));

/** A timestamp shown as a date in the local zone: "15.01.2025". */
export const formatChangeDate = (iso: string) => formatDate(new Date(iso));

export const formatMonthOrDash = (iso: string | null) =>
  iso ? formatMonthYear(iso) : EMPTY_VALUE;

export const formatDayOrDash = (iso: string | null) =>
  iso ? formatDay(iso) : EMPTY_VALUE;

export type RangePrecision = 'day' | 'month';

/** "01.2025 – 12.2026" or "01.01.2024 – 31.12.2026"; a dash when either end is missing. */
export function formatRange(
  from: string | null,
  to: string | null,
  precision: RangePrecision
): string {
  if (!from || !to) return EMPTY_VALUE;

  const format = precision === 'month' ? formatMonthYear : formatDay;
  return `${format(from)}${RANGE_SEPARATOR}${format(to)}`;
}
