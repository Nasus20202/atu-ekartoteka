import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

export const createMockUser = (
  overrides: {
    id?: string;
    email?: string;
    name?: string | null;
    role?: UserRole;
    status?: AccountStatus;
    emailVerified?: boolean;
    mustChangePassword?: boolean;
    apartments?: unknown[];
    password?: string | null;
    authMethod?: AuthMethod | null;
  } = {}
) => ({
  id: 'user-123',
  email: 'test@example.com',
  password: 'hashed_password',
  name: 'Test User',
  role: UserRole.TENANT,
  status: AccountStatus.APPROVED,
  emailVerified: true,
  mustChangePassword: false,
  authMethod: AuthMethod.CREDENTIALS,
  createdAt: new Date(),
  updatedAt: new Date(),
  apartments: [],
  ...overrides,
});

export const mockUsers = {
  tenant: createMockUser(),
  admin: createMockUser({
    id: 'admin-456',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
  }),
  pending: createMockUser({
    id: 'user-456',
    email: 'pending@example.com',
    name: 'Pending User',
    status: AccountStatus.PENDING,
  }),
  rejected: createMockUser({
    id: 'user-789',
    email: 'rejected@example.com',
    name: 'Rejected User',
    status: AccountStatus.REJECTED,
  }),
  approved: createMockUser({
    email: 'approved@example.com',
    name: 'Approved User',
  }),
  mustChangePassword: createMockUser({
    id: 'user-mcp',
    email: 'mcp@example.com',
    name: 'Must Change User',
    mustChangePassword: true,
  }),
  withApartments: createMockUser({
    apartments: [
      {
        id: 'apt-456',
        externalId: 'W00001',
        number: '1',
      },
    ],
  }),
};
