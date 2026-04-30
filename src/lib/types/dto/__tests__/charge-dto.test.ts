import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import {
  toChargeDisplayDto,
  toChargePdfItemDto,
} from '@/lib/types/dto/charge-dto';

describe('toChargeDisplayDto', () => {
  it('converts decimal and date fields into plain strings', () => {
    const dto = toChargeDisplayDto({
      id: 'charge-1',
      description: 'Czynsz',
      quantity: new Prisma.Decimal('1.5000'),
      unit: 'm2',
      unitPrice: new Prisma.Decimal('12.3400'),
      totalAmount: new Prisma.Decimal('18.5100'),
      dateFrom: new Date('2025-01-01T00:00:00.000Z'),
      dateTo: new Date('2025-01-31T00:00:00.000Z'),
    });

    expect(dto.quantity).toBe('1.5');
    expect(dto.unitPrice).toBe('12.34');
    expect(dto.totalAmount).toBe('18.51');
    expect(dto.dateFrom).toBe('2025-01-01T00:00:00.000Z');
    expect(dto.dateTo).toBe('2025-01-31T00:00:00.000Z');
  });
});

describe('toChargePdfItemDto', () => {
  it('removes date fields for PDF props', () => {
    const dto = toChargePdfItemDto({
      id: 'charge-1',
      description: 'Czynsz',
      quantity: '1.5',
      unit: 'm2',
      unitPrice: '12.34',
      totalAmount: '18.51',
      dateFrom: '2025-01-01T00:00:00.000Z',
      dateTo: '2025-01-31T00:00:00.000Z',
    });

    expect(dto).toEqual({
      id: 'charge-1',
      description: 'Czynsz',
      quantity: '1.5',
      unit: 'm2',
      unitPrice: '12.34',
      totalAmount: '18.51',
    });
  });
});
