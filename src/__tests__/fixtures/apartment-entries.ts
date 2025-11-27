import type { ApartmentEntry } from '@/lib/parsers/apartment-parser';

export const createMockApartmentEntry = (
  overrides: Partial<ApartmentEntry> = {}
): ApartmentEntry => ({
  id: 'W1',
  owner: 'Jan Kowalski',
  email: 'jan.kowalski@example.com',
  externalId: 'EXT1',
  address: 'ul. Testowa 1',
  building: 'B1',
  number: '1',
  postalCode: '00-001',
  city: 'Warszawa',
  shareNumerator: 50.5,
  shareDenominator: 2.5,
  isOwner: true,
  ...overrides,
});

export const mockApartmentEntries = {
  owner: createMockApartmentEntry(),
  tenant: createMockApartmentEntry({
    id: 'L1',
    owner: 'Tenant 1',
    isOwner: false,
  }),
  secondOwner: createMockApartmentEntry({
    id: 'W2',
    owner: 'Anna Nowak',
    email: 'anna.nowak@example.com',
    externalId: 'EXT2',
    address: 'ul. Testowa 2',
    building: 'B2',
    number: '2',
    postalCode: '00-002',
    city: 'Kraków',
    shareNumerator: 60.0,
    shareDenominator: 2.6,
  }),
};
