export const createMockApartment = (
  overrides: {
    id?: string;
    homeownersAssociationId?: string;
    externalId?: string;
    owner?: string;
    address?: string;
    building?: string;
    number?: string;
    postalCode?: string;
    city?: string;
    area?: number;
    height?: number;
    isActive?: boolean;
    user?: unknown;
  } = {}
) => ({
  id: 'apt1',
  homeownersAssociationId: 'hoa1',
  externalId: 'EXT1',
  owner: 'John Doe',
  address: 'Main Street 1',
  building: 'A',
  number: '101',
  postalCode: '00-001',
  city: 'Warsaw',
  area: 55.5,
  height: 2.7,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: null,
  ...overrides,
});

export const mockApartments = {
  active: createMockApartment(),
  inactive: createMockApartment({
    id: 'apt2',
    externalId: 'EXT2',
    owner: 'Owner 2',
    address: 'Street 2',
    building: 'B',
    number: '202',
    postalCode: '00-002',
    area: 60,
    height: 2.6,
    isActive: false,
  }),
};
