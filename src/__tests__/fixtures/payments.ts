import { Prisma } from '@/generated/prisma/browser';
import type { Payment } from '@/lib/types';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';

const zero = () => new Prisma.Decimal(0);

export const createMockPayment = (
  overrides: Partial<Payment> = {}
): Payment => {
  const monthAmounts = Object.fromEntries(
    [...PAYMENT_MONTH_FIELD_KEYS, ...CHARGE_MONTH_FIELD_KEYS].map((key) => [
      key,
      zero(),
    ])
  );

  return {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: zero(),
    closingBalance: zero(),
    openingDebt: zero(),
    openingSurplus: zero(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...monthAmounts,
    ...overrides,
  } as Payment;
};
