import { type Decimal, toDecimal } from '@/lib/shared/utils/decimal';

/** A printed number such as "-4,700000"; no thousands separators. */
export const NUMBER = String.raw`(-?\d+(?:,\d+)?)`;
export const DATE = String.raw`(\d{2}\/\d{2}\/\d{4})`;

const OVERPAID_LABEL = 'Nadpłata';
export const RESULT_LABEL = String.raw`(Nadpłata|Niedopłata|Razem do zapłaty|Do zapłaty)`;

export function parseNumber(value: string): Decimal {
  return toDecimal(value.replace(',', '.'));
}

/** "30/09/2022" -> "2022-09-30", or null when it is not a calendar date. */
export function parsePrintedDate(value: string): string | null {
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const iso = date.toISOString().slice(0, 10);
  const printed = value.split('/').reverse().join('-');
  return iso === printed ? iso : null;
}

/** A printed result as a signed amount: negative when overpaid. */
export function signedResult(label: string, value: string): Decimal {
  const amount = parseNumber(value);
  return label === OVERPAID_LABEL ? amount.negated() : amount;
}
