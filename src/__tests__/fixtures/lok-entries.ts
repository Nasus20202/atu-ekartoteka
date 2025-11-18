import type { LokEntry } from '@/lib/lok-parser';

export const createMockLokEntry = (
  overrides: Partial<LokEntry> = {}
): LokEntry => ({
  id: 'W1',
  owner: 'Jan Kowalski',
  externalId: 'EXT1',
  address: 'ul. Testowa 1',
  building: 'B1',
  number: '1',
  postalCode: '00-001',
  city: 'Warszawa',
  area: 50.5,
  height: 2.5,
  isOwner: true,
  ...overrides,
});

export const mockLokEntries = {
  owner: createMockLokEntry(),
  tenant: createMockLokEntry({
    id: 'L1',
    owner: 'Tenant 1',
    isOwner: false,
  }),
  secondOwner: createMockLokEntry({
    id: 'W2',
    owner: 'Anna Nowak',
    externalId: 'EXT2',
    address: 'ul. Testowa 2',
    building: 'B2',
    number: '2',
    postalCode: '00-002',
    city: 'Kraków',
    area: 60.0,
    height: 2.6,
  }),
};
