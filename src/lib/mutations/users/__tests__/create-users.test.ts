import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

const { mockUserCreate, mockApartmentUpdateMany, mockTransaction } = vi.hoisted(
  () => ({
    mockUserCreate: vi.fn(),
    mockApartmentUpdateMany: vi.fn(),
    mockTransaction: vi.fn(),
  })
);

vi.mock('@/lib/database/prisma', () => ({
  prisma: { user: { create: mockUserCreate }, $transaction: mockTransaction },
}));

import { createGoogleUser } from '@/lib/mutations/users/create-google-user';
import { createUserWithApartments } from '@/lib/mutations/users/create-user-with-apartments';

describe('createGoogleUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a verified Google user without a password', async () => {
    await createGoogleUser({ email: 'jan@gmail.com', name: 'Jan' });

    expect(mockUserCreate).toHaveBeenCalledWith({
      data: {
        email: 'jan@gmail.com',
        name: 'Jan',
        emailVerified: true,
        password: null,
        authMethod: AuthMethod.GOOGLE,
      },
    });
  });

  it('stores a missing name as null', async () => {
    await createGoogleUser({ email: 'jan@gmail.com', name: undefined });

    expect(mockUserCreate.mock.calls[0][0].data.name).toBeNull();
  });
});

describe('createUserWithApartments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          user: { create: mockUserCreate.mockResolvedValue({ id: 'user-1' }) },
          apartment: { updateMany: mockApartmentUpdateMany },
        })
    );
  });

  it('creates an approved tenant and assigns the apartments', async () => {
    await createUserWithApartments({
      email: 'jan@example.com',
      hashedPassword: 'hash',
      owner: 'Jan',
      apartmentIds: ['a', 'b'],
    });

    expect(mockUserCreate).toHaveBeenCalledWith({
      data: {
        email: 'jan@example.com',
        password: 'hash',
        name: 'Jan',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        mustChangePassword: true,
        authMethod: AuthMethod.CREDENTIALS,
      },
    });
    expect(mockApartmentUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] } },
      data: { userId: 'user-1' },
    });
  });

  it('stores a missing owner name as null', async () => {
    await createUserWithApartments({
      email: 'jan@example.com',
      hashedPassword: 'hash',
      owner: null,
      apartmentIds: [],
    });

    expect(mockUserCreate.mock.calls[0][0].data.name).toBeNull();
  });
});
