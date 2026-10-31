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

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

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
