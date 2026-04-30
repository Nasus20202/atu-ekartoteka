import { Prisma } from '@/generated/prisma/browser';
import { type Decimal, type DecimalLike, toDecimal } from '@/lib/money/decimal';

export function sumDecimals(values: DecimalLike[]): Decimal {
  return values.reduce<Decimal>(
    (sum, value) => sum.plus(toDecimal(value)),
    new Prisma.Decimal(0)
  );
}
