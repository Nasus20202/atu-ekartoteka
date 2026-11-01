import { vi } from 'vitest';

import { EntityStats, HOAContext, TransactionClient } from '@/lib/import/types';
import { ApartmentEntry } from '@/lib/parsers/apartment-parser';

export const IMPORT_DAY = new Date('2025-02-10T09:00:00Z');
export const ENDED_ON = new Date('2025-02-09T00:00:00Z');
export const STARTED_ON = new Date('2025-02-10T00:00:00Z');
export const FUTURE_END = new Date('2025-03-01T00:00:00Z');

export const HOA: HOAContext = { id: 'hoa-1', externalId: 'TEST01' };

export function createMockTx() {
  return {
    apartment: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  } as unknown as TransactionClient;
}

export function createStats(): EntityStats {
  return { total: 0, created: 0, updated: 0, skipped: 0, deleted: 0 };
}

export function createEntry(
  overrides: Partial<ApartmentEntry> = {}
): ApartmentEntry {
  return {
    externalOwnerId: 'W001',
    externalApartmentId: 'APT001',
    owner: 'Test Owner',
    email: 'test@example.com',
    address: 'Test Street 1',
    building: 'A',
    number: '1',
    postalCode: '00-001',
    city: 'Warsaw',
    shareNumerator: 1,
    shareDenominator: 100,
    isOwner: true,
    validFrom: STARTED_ON,
    validTo: null,
    ...overrides,
  };
}

export function createExisting(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-1',
    externalOwnerId: 'W001',
    externalApartmentId: 'APT001',
    owner: 'Test Owner',
    email: 'test@example.com',
    address: 'Test Street 1',
    building: 'A',
    number: '1',
    postalCode: '00-001',
    city: 'Warsaw',
    shareNumerator: 1,
    shareDenominator: 100,
    validFrom: STARTED_ON,
    validTo: null,
    isActive: true,
    homeownersAssociationId: 'hoa-1',
    ...overrides,
  };
}
