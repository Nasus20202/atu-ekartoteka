import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/lib/types';

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    user: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

const { findTenantUsers } =
  await import('@/lib/queries/users/find-tenant-users');

describe('findTenantUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation((queries: unknown[]) =>
      Promise.all(queries)
    );
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  it('filters by TENANT role with no extra filters', async () => {
    await findTenantUsers();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: UserRole.TENANT },
      })
    );
  });

  it('filters by status when provided', async () => {
    await findTenantUsers(AccountStatus.PENDING);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
        }),
      })
    );
  });

  it('adds OR search filter when search is provided', async () => {
    await findTenantUsers(null, 1, 50, 'kowalski');

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: UserRole.TENANT,
          OR: expect.arrayContaining([
            { name: { contains: 'kowalski', mode: 'insensitive' } },
            { email: { contains: 'kowalski', mode: 'insensitive' } },
            expect.objectContaining({
              apartments: expect.objectContaining({ some: expect.anything() }),
            }),
          ]),
        }),
      })
    );
  });

  it('combines status and search filters', async () => {
    await findTenantUsers(AccountStatus.APPROVED, 1, 50, 'jan');

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
          OR: expect.any(Array),
        }),
      })
    );
  });

  it('ignores blank search string', async () => {
    await findTenantUsers(null, 1, 50, '   ');

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: UserRole.TENANT },
      })
    );
  });

  it('ignores null search', async () => {
    await findTenantUsers(null, 1, 50, null);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: UserRole.TENANT },
      })
    );
  });

  it('applies correct pagination', async () => {
    await findTenantUsers(null, 3, 20);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 40,
        take: 20,
      })
    );
  });

  it('returns users and total from transaction', async () => {
    const mockUsers = [{ id: '1', name: 'Jan', email: 'jan@test.com' }];
    mockTransaction.mockResolvedValue([mockUsers, 1]);

    const result = await findTenantUsers();

    expect(result).toEqual({ users: mockUsers, total: 1 });
  });

  it('allows listing admin users when role is provided', async () => {
    await findTenantUsers(null, 1, 50, null, UserRole.ADMIN);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: UserRole.ADMIN },
      })
    );
  });
});
