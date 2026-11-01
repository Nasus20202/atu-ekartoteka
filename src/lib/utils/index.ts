import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { DecimalLike, toDecimal } from '@/lib/utils/decimal';
import { APP_LOCALE } from '@/lib/utils/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MONTH_NAMES_PL = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
] as const;

export const formatPeriod = (period: string): string => {
  if (period.length === 6) {
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    return `${MONTH_NAMES_PL[parseInt(month) - 1]} ${year}`;
  }
  return period;
};

export const formatCurrency = (amount: DecimalLike): string => {
  return new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency: 'PLN',
  }).format(Number(toDecimal(amount).toFixed(2)));
};

const DECIMAL_POINT = '.';
const DECIMAL_COMMA = ',';

/** Exact quantity with a Polish decimal comma, e.g. 50.5 -> "50,5". */
export const formatQuantity = (quantity: DecimalLike): string =>
  toDecimal(quantity).toString().replace(DECIMAL_POINT, DECIMAL_COMMA);

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * A calendar date stored at midnight UTC, such as an owner period or a WMB
 * export date. Formatting it in the local zone would shift the day west of UTC,
 * so the date is read back in the zone it was written in.
 */
const UTC_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
};

export const formatUtcDate = (date: Date): string =>
  date.toLocaleDateString(APP_LOCALE, UTC_DATE_FORMAT);

const SHARE_PERCENT_DECIMALS = 4;

const sharePercentFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: SHARE_PERCENT_DECIMALS,
  useGrouping: false,
});

/** Formats the database `shareRatio` as a percentage, or null when unknown. */
export function formatSharePercent(shareRatio: number | null): string | null {
  if (shareRatio === null) return null;
  return `${sharePercentFormat.format(shareRatio * 100)}%`;
}
