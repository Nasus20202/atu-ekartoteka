export const createMockApartment = (
  overrides: {
    id?: string;
    homeownersAssociationId?: string;
    externalOwnerId?: string;
    externalApartmentId?: string;
    owner?: string;
    email?: string | null;
    address?: string;
    building?: string;
    number?: string;
    postalCode?: string;
    city?: string;
    shareNumerator?: number;
    shareDenominator?: number;
    isActive?: boolean;
    user?: unknown;
    userId?: string | null;
  } = {}
) => ({
  id: 'apt1',
  homeownersAssociationId: 'hoa1',
  externalOwnerId: 'W00001',
  externalApartmentId: 'APT-001',
  owner: 'John Doe',
  email: 'john.doe@example.com',
  address: 'Main Street 1',
  building: 'A',
  number: '101',
  postalCode: '00-001',
  city: 'Warsaw',
  shareNumerator: 55.5,
  shareDenominator: 2.7,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: null,
  userId: null,
  ...overrides,
});

export const mockApartments = {
  active: createMockApartment(),
  inactive: createMockApartment({
    id: 'apt2',
    externalOwnerId: 'W00002',
    externalApartmentId: 'APT-002',
    owner: 'Owner 2',
    address: 'Street 2',
    building: 'B',
    number: '202',
    postalCode: '00-002',
    shareNumerator: 60,
    shareDenominator: 2.6,
    isActive: false,
  }),
};
