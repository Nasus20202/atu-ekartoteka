import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockUserFindUnique = vi.fn();
const mockApartmentFindMany = vi.fn();
const mockApartmentUpdateMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/auth', () => ({ auth: mockAuth }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: { findMany: mockApartmentFindMany },
    user: { findUnique: mockUserFindUnique },
    $transaction: mockTransaction,
  },
}));

vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: vi.fn((userId: string) =>
    Promise.resolve(userId.startsWith('admin'))
  ),
  isAdminRole: (role: string | null | undefined) => role === 'ADMIN',
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

function adminSession() {
  return {
    user: { id: 'admin-id', email: 'admin@example.com', role: UserRole.ADMIN },
    expires: new Date().toISOString(),
  };
}

// The data of a successful result, or the failure itself
function dataOf(result: { ok: boolean }) {
  const value = result as any;
  return value.ok ? value.data : value;
}

describe('bulkAssignAccountsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        apartment: { updateMany: mockApartmentUpdateMany },
      };
      return fn(tx);
    });
  });

  it('should return an unauthenticated result when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result).toMatchObject({ ok: false, code: 'unauthenticated' });
    expect(data.error).toBe('Brak uprawnień');
  });

  it('should return a forbidden result when user is not admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'u', email: 'u@e.com', role: UserRole.TENANT },
      expires: new Date().toISOString(),
    });

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({ apartmentIds: ['apt-1'] });

    expect(result).toMatchObject({ ok: false, code: 'forbidden' });
  });

  it('should return an invalid result when apartmentIds is empty', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({ apartmentIds: [] });
    const data = dataOf(result);

    expect(result).toMatchObject({ ok: false, code: 'invalid' });
    expect(data.error).toBe('Wybierz co najmniej jedno mieszkanie');
  });

  it('should return an invalid result when apartmentIds is missing', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({});

    expect(result).toMatchObject({ ok: false, code: 'invalid' });
  });

  it('should assign existing user to apartment', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'tenant@example.com' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user-id' });
    mockApartmentUpdateMany.mockResolvedValueOnce({ count: 1 });

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ assigned: 1, skipped: 0, errors: 0 });
    expect(mockApartmentUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['apt-1'] }, userId: null },
      data: { userId: 'existing-user-id' },
    });
  });

  it('should deduplicate by email — two apartments, one existing user', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'shared@example.com' },
      { id: 'apt-2', email: 'shared@example.com' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user-id' });
    mockApartmentUpdateMany.mockResolvedValueOnce({ count: 2 });

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({
      apartmentIds: ['apt-1', 'apt-2'],
    });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ assigned: 2, skipped: 0, errors: 0 });
    // Only one findUnique call (deduplicated)
    expect(mockUserFindUnique).toHaveBeenCalledTimes(1);
    expect(mockApartmentUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['apt-1', 'apt-2'] }, userId: null },
      data: { userId: 'existing-user-id' },
    });
  });

  it('should skip apartment when no matching user found', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'nobody@example.com' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce(null);

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ assigned: 0, skipped: 1, errors: 0 });
    expect(mockApartmentUpdateMany).not.toHaveBeenCalled();
  });

  it('should handle race condition — apartment already assigned at submit time', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    // Apartment is still unassigned at fetch time...
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'tenant@example.com' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user-id' });
    // ...but updateMany only updates 0 rows (assigned in the meantime)
    mockApartmentUpdateMany.mockResolvedValueOnce({ count: 0 });

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ assigned: 0, skipped: 1, errors: 0 });
  });

  it('returns a failure when the apartments cannot be loaded', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockRejectedValueOnce(new Error('DB down'));

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({ apartmentIds: ['apt-1'] });

    expect(result).toEqual({
      ok: false,
      error: 'Nie udało się przypisać mieszkań',
      code: 'failed',
    });
  });

  it('should track errors when DB transaction fails', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'tenant@example.com' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user-id' });
    mockTransaction.mockRejectedValueOnce(new Error('DB error'));

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ assigned: 0, skipped: 0, errors: 1 });
  });

  it('should handle multiple apartments across different emails', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'a@example.com' },
      { id: 'apt-2', email: 'b@example.com' },
    ]);
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'user-a' })
      .mockResolvedValueOnce({ id: 'user-b' });
    mockApartmentUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });

    const { bulkAssignAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkAssignAccountsAction({
      apartmentIds: ['apt-1', 'apt-2'],
    });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ assigned: 2, skipped: 0, errors: 0 });
  });
});
