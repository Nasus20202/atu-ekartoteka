import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma } from '@/generated/prisma/client';
import { createFirstAdmin } from '@/lib/mutations/users/create-first-admin';
import { AccountStatus, UserRole } from '@/lib/types';

const { mockTransaction, mockFindFirst, mockCreate } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: { $transaction: mockTransaction },
}));

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('failure', {
    code,
    clientVersion: 'test',
  });
}

describe('createFirstAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback({ user: { findFirst: mockFindFirst, create: mockCreate } })
    );
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'admin-id' });
  });

  it('creates the admin with a normalised email inside a serialisable transaction', async () => {
    await createFirstAdmin({
      email: ' Admin@Example.com ',
      hashedPassword: 'hashed',
      name: 'Admin',
    });

    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email: 'admin@example.com',
        password: 'hashed',
        name: 'Admin',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        emailVerified: true,
      },
      select: expect.objectContaining({ id: true, emailVerified: true }),
    });
  });

  it('returns null without creating a second admin', async () => {
    mockFindFirst.mockResolvedValue({ id: 'existing-admin' });

    expect(
      await createFirstAdmin({
        email: 'admin2@example.com',
        hashedPassword: 'hashed',
        name: null,
      })
    ).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('treats a serialisation conflict as "admin already exists"', async () => {
    mockCreate.mockRejectedValue(knownError('P2034'));

    expect(
      await createFirstAdmin({
        email: 'admin@example.com',
        hashedPassword: 'hashed',
        name: null,
      })
    ).toBeNull();
  });

  it('rethrows a duplicate email conflict', async () => {
    mockCreate.mockRejectedValue(knownError('P2002'));

    await expect(
      createFirstAdmin({
        email: 'admin@example.com',
        hashedPassword: 'hashed',
        name: null,
      })
    ).rejects.toThrow();
  });
});
