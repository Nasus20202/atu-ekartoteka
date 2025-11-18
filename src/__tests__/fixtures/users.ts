import { AccountStatus, UserRole } from '@/generated/prisma';

export const createMockUser = (
  overrides: {
    id?: string;
    email?: string;
    name?: string | null;
    role?: UserRole;
    status?: AccountStatus;
    apartmentId?: string | null;
  } = {}
) => ({
  id: 'user-123',
  email: 'test@example.com',
  password: 'hashed_password',
  name: 'Test User',
  role: UserRole.TENANT,
  status: AccountStatus.APPROVED,
  createdAt: new Date(),
  updatedAt: new Date(),
  apartmentId: null,
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
  withApartment: createMockUser({
    apartmentId: 'apt-456',
  }),
};
