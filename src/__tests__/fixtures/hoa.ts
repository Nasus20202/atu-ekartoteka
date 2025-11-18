export const createMockHOA = (
  overrides: {
    id?: string;
    externalId?: string;
    name?: string;
  } = {}
) => ({
  id: 'hoa1',
  externalId: 'HOA001',
  name: 'HOA001',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockHOA = createMockHOA();
