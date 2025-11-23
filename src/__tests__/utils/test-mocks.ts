import { AccountStatus, AuthMethod, UserRole } from '@/generated/prisma';

export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    role: UserRole.TENANT,
    status: AccountStatus.PENDING,
    emailVerified: false,
    authMethod: AuthMethod.CREDENTIALS,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockAdmin(overrides: Partial<any> = {}) {
  return createMockUser({
    id: 'test-admin-id',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: UserRole.ADMIN,
    status: AccountStatus.APPROVED,
    emailVerified: true,
    ...overrides,
  });
}
