import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import {
  serializeCharge,
  toSerializableCharge,
} from '@/lib/charges/serialize-charge';

describe('serializeCharge', () => {
  it('converts decimal and date fields into plain strings', () => {
    const serialized = serializeCharge({
      id: 'charge-1',
      description: 'Czynsz',
      quantity: new Prisma.Decimal('1.5000'),
      unit: 'm2',
      unitPrice: new Prisma.Decimal('12.3400'),
      totalAmount: new Prisma.Decimal('18.5100'),
      dateFrom: new Date('2025-01-01T00:00:00.000Z'),
      dateTo: new Date('2025-01-31T00:00:00.000Z'),
    });

    expect(serialized.quantity).toBe('1.5');
    expect(serialized.unitPrice).toBe('12.34');
    expect(serialized.totalAmount).toBe('18.51');
    expect(serialized.dateFrom).toBe('2025-01-01T00:00:00.000Z');
    expect(serialized.dateTo).toBe('2025-01-31T00:00:00.000Z');
  });
});

describe('toSerializableCharge', () => {
  it('removes date fields for PDF props', () => {
    const charge = toSerializableCharge({
      id: 'charge-1',
      description: 'Czynsz',
      quantity: '1.5',
      unit: 'm2',
      unitPrice: '12.34',
      totalAmount: '18.51',
      dateFrom: '2025-01-01T00:00:00.000Z',
      dateTo: '2025-01-31T00:00:00.000Z',
    });

    expect(charge).toEqual({
      id: 'charge-1',
      description: 'Czynsz',
      quantity: '1.5',
      unit: 'm2',
      unitPrice: '12.34',
      totalAmount: '18.51',
    });
  });
});
