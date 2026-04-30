import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import { serializePayment } from '@/lib/payments/serialize-payment';
import type { Payment } from '@/lib/types';

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: new Prisma.Decimal('1.2300'),
    closingBalance: new Prisma.Decimal('-4.5600'),
    openingDebt: new Prisma.Decimal('0.0000'),
    openingSurplus: new Prisma.Decimal('7.8900'),
    januaryPayments: new Prisma.Decimal('10.0000'),
    februaryPayments: new Prisma.Decimal('0.0000'),
    marchPayments: new Prisma.Decimal('0.0000'),
    aprilPayments: new Prisma.Decimal('0.0000'),
    mayPayments: new Prisma.Decimal('0.0000'),
    junePayments: new Prisma.Decimal('0.0000'),
    julyPayments: new Prisma.Decimal('0.0000'),
    augustPayments: new Prisma.Decimal('0.0000'),
    septemberPayments: new Prisma.Decimal('0.0000'),
    octoberPayments: new Prisma.Decimal('0.0000'),
    novemberPayments: new Prisma.Decimal('0.0000'),
    decemberPayments: new Prisma.Decimal('0.0000'),
    januaryCharges: new Prisma.Decimal('2.5000'),
    februaryCharges: new Prisma.Decimal('0.0000'),
    marchCharges: new Prisma.Decimal('0.0000'),
    aprilCharges: new Prisma.Decimal('0.0000'),
    mayCharges: new Prisma.Decimal('0.0000'),
    juneCharges: new Prisma.Decimal('0.0000'),
    julyCharges: new Prisma.Decimal('0.0000'),
    augustCharges: new Prisma.Decimal('0.0000'),
    septemberCharges: new Prisma.Decimal('0.0000'),
    octoberCharges: new Prisma.Decimal('0.0000'),
    novemberCharges: new Prisma.Decimal('0.0000'),
    decemberCharges: new Prisma.Decimal('0.0000'),
    createdAt: new Date('2024-01-15T12:00:00.000Z'),
    updatedAt: new Date('2024-02-15T12:00:00.000Z'),
    ...overrides,
  };
}

describe('serializePayment', () => {
  it('converts decimal and date fields into plain strings', () => {
    const payment = makePayment();

    const serialized = serializePayment(payment);

    expect(serialized.openingBalance).toBe('1.23');
    expect(serialized.closingBalance).toBe('-4.56');
    expect(serialized.openingSurplus).toBe('7.89');
    expect(serialized.januaryPayments).toBe('10');
    expect(serialized.januaryCharges).toBe('2.5');
    expect(serialized.dateFrom).toBe('2024-01-01T00:00:00.000Z');
    expect(serialized.updatedAt).toBe('2024-02-15T12:00:00.000Z');
  });
});
