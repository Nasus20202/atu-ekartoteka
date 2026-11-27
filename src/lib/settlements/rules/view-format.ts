// Display formats shared by the settlement views and their PDF documents.

import { formatDay } from '@/lib/settlements/rules/format';
import { formatCurrency } from '@/lib/shared/utils';
import { type DecimalLike, toDecimal } from '@/lib/shared/utils/decimal';
import { APP_LOCALE } from '@/lib/shared/utils/locale';

const VOLUME_DECIMALS = { min: 3, max: 6 };
const PRICE_DECIMALS = { min: 2, max: 4 };
const COEFFICIENT_DECIMALS = { min: 4, max: 4 };

const PRINTED_UNITS: Record<string, string> = { m3: 'm³' };

function formatNumber(
  value: DecimalLike,
  { min, max }: { min: number; max: number }
): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(Number(toDecimal(value).toString()));
}

export const formatUnit = (unit: string) =>
  Object.hasOwn(PRINTED_UNITS, unit) ? PRINTED_UNITS[unit] : unit;

/** A quantity or meter state, followed by its unit when one is known. */
export function formatVolume(value: DecimalLike, unit?: string | null) {
  const number = formatNumber(value, VOLUME_DECIMALS);
  // A unit never wraps away from its number
  return unit ? `${number}\u00a0${formatUnit(unit)}` : number;
}

export const formatPrice = (value: DecimalLike) =>
  `${formatNumber(value, PRICE_DECIMALS)} zł`;

export const formatBasis = (value: DecimalLike) =>
  formatNumber(value, PRICE_DECIMALS);

export const formatCoefficient = (value: DecimalLike) =>
  formatNumber(value, COEFFICIENT_DECIMALS);

/** An amount without its sign, for use next to "nadpłata" or "niedopłata". */
export const formatAbsoluteAmount = (value: DecimalLike) =>
  formatCurrency(toDecimal(value).abs());

const YEAR_LENGTH = 4;
const yearOfDay = (date: string) => date.slice(0, YEAR_LENGTH);

/** "01.05 – 30.09.2022", with both years when the span crosses one. */
export function formatRange(from: string, to: string): string {
  const start = formatDay(from);
  const shortStart =
    yearOfDay(from) === yearOfDay(to)
      ? start.slice(0, -(YEAR_LENGTH + 1))
      : start;
  return `${shortStart} – ${formatDay(to)}`;
}

/** "Rok 2025" for a whole calendar year, otherwise the span. */
export function formatAnnualPeriod(from: string, to: string): string {
  const year = yearOfDay(to);
  return from === `${year}-01-01` && to === `${year}-12-31`
    ? `Rok ${year}`
    : formatRange(from, to);
}
