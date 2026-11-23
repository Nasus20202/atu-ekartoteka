import { Prisma } from '@/generated/prisma/browser';

export type Decimal = InstanceType<typeof Prisma.Decimal>;
export type DecimalLike = Decimal | number | string;

export function toDecimal(value: DecimalLike): Decimal {
  if (Prisma.Decimal.isDecimal(value)) {
    return value;
  }

  return new Prisma.Decimal(value);
}

export function isZeroAmount(value: DecimalLike): boolean {
  return toDecimal(value).isZero();
}

// Scale of every @db.Decimal(14, 4) column in prisma/schema.prisma
export const DB_DECIMAL_SCALE = 4;

/** Compares an incoming value as PostgreSQL would store it (half away from zero). */
export function decimalEqualsStored(
  stored: DecimalLike,
  incoming: DecimalLike
): boolean {
  return toDecimal(stored).equals(
    toDecimal(incoming).toDecimalPlaces(
      DB_DECIMAL_SCALE,
      Prisma.Decimal.ROUND_HALF_UP
    )
  );
}
