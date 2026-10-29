import { Prisma } from '@/generated/prisma/browser';
import type { Charge, ChargeNotification } from '@/lib/types';

export const createMockCharge = (overrides: Partial<Charge> = {}): Charge => ({
  id: 'charge-1',
  externalLineNo: 1,
  apartmentId: 'apt-1',
  dateFrom: new Date('2025-01-01T00:00:00.000Z'),
  dateTo: new Date('2025-01-31T00:00:00.000Z'),
  period: '202501',
  description: 'Fundusz remontowy',
  quantity: new Prisma.Decimal(1),
  unit: 'm2',
  unitPrice: new Prisma.Decimal('10.5'),
  totalAmount: new Prisma.Decimal('10.5'),
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

export const createMockChargeNotification = (
  overrides: Partial<ChargeNotification> = {}
): ChargeNotification => ({
  id: 'notification-1',
  lineNo: 1,
  apartmentId: 'apt-1',
  description: 'Woda',
  quantity: new Prisma.Decimal(2),
  unit: 'm3',
  unitPrice: new Prisma.Decimal('12.5'),
  totalAmount: new Prisma.Decimal(25),
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});
