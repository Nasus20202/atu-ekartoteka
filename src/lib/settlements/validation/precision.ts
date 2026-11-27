import type { Decimal } from '@/lib/shared/utils/decimal';

/** Decimal places and total digits of the database columns. */
export const COLUMN_PRECISION = {
  amount: { digits: 14, places: 4 },
  quantity: { digits: 14, places: 6 },
  reading: { digits: 14, places: 3 },
  coefficient: { digits: 7, places: 4 },
} as const;

export type ValueColumn = keyof typeof COLUMN_PRECISION;

/** True when the database can keep the value exactly as printed. */
export function fitsColumn(value: Decimal, column: ValueColumn): boolean {
  const { digits, places } = COLUMN_PRECISION[column];
  return (
    value.decimalPlaces() <= places && value.abs().lt(`1e${digits - places}`)
  );
}

export function unstorableValues(
  values: Array<[Decimal, ValueColumn]>
): Decimal[] {
  return values
    .filter(([value, column]) => !fitsColumn(value, column))
    .map(([value]) => value);
}
