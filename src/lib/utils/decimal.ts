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
