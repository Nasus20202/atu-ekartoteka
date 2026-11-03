import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserCreate = vi.fn();
const mockApartmentFindMany = vi.fn();
const mockApartmentUpdateMany = vi.fn();
const mockTransaction = vi.fn();
const mockSendAccountActivationEmail = vi.fn().mockResolvedValue(true);

vi.mock('@/auth', () => ({ auth: mockAuth }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: { findMany: mockApartmentFindMany },
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('@/lib/email/email-service', () => ({
  getEmailService: () => ({
    sendAccountActivationEmail: mockSendAccountActivationEmail,
  }),
}));

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}));

vi.mock('crypto', () => ({
  default: { randomBytes: vi.fn().mockReturnValue(Buffer.alloc(12, 65)) },
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

describe('bulkCreateAccountsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendAccountActivationEmail.mockResolvedValue(true);

    // Default transaction: run the callback with a tx proxy
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        user: { create: mockUserCreate },
        apartment: { updateMany: mockApartmentUpdateMany },
      };
      return fn(tx);
    });
  });

  it('should return an unauthenticated result when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result).toMatchObject({ ok: false, code: 'unauthenticated' });
    expect(data.error).toBe('Brak uprawnień');
  });

  it('should return a forbidden result when user is not admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'u', email: 'u@e.com', role: UserRole.TENANT },
      expires: new Date().toISOString(),
    });

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({ apartmentIds: ['apt-1'] });

    expect(result).toMatchObject({ ok: false, code: 'forbidden' });
  });

  it('should return an invalid result when apartmentIds is empty', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({ apartmentIds: [] });
    const data = dataOf(result);

    expect(result).toMatchObject({ ok: false, code: 'invalid' });
    expect(data.error).toBe('Wybierz co najmniej jedno mieszkanie');
  });

  it('should return an invalid result when apartmentIds is missing', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({});

    expect(result).toMatchObject({ ok: false, code: 'invalid' });
  });

  it('should create a user for a single apartment', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'owner@example.com', owner: 'Jan Kowalski' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({ id: 'new-user-id' });

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ created: 1, skipped: 0, errors: 0 });
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'owner@example.com',
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
          emailVerified: true,
          mustChangePassword: true,
          authMethod: AuthMethod.CREDENTIALS,
        }),
      })
    );
  });

  it('should deduplicate by email (two apartments, one email)', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'shared@example.com', owner: 'Jan' },
      { id: 'apt-2', email: 'shared@example.com', owner: 'Jan' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({ id: 'new-user-id' });

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({
      apartmentIds: ['apt-1', 'apt-2'],
    });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data.created).toBe(1);
    // Both apartments should be updated in one transaction
    expect(mockApartmentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['apt-1', 'apt-2'] } },
      })
    );
  });

  it('should skip apartments for already-existing email', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'existing@example.com', owner: 'Existing' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user' });

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ created: 0, skipped: 1, errors: 0 });
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('should track errors when DB transaction fails', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'owner@example.com', owner: 'Jan' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockTransaction.mockRejectedValueOnce(new Error('DB error'));

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({ apartmentIds: ['apt-1'] });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ created: 0, skipped: 0, errors: 1 });
  });

  it('should handle multiple apartments across multiple emails', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'a@example.com', owner: 'A' },
      { id: 'apt-2', email: 'b@example.com', owner: 'B' },
    ]);
    // Both do not exist yet
    mockUserFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockUserCreate
      .mockResolvedValueOnce({ id: 'user-a' })
      .mockResolvedValueOnce({ id: 'user-b' });

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({
      apartmentIds: ['apt-1', 'apt-2'],
    });
    const data = dataOf(result);

    expect(result.ok).toBe(true);
    expect(data).toEqual({ created: 2, skipped: 0, errors: 0 });
  });

  it('still creates the account when the activation email fails', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'owner@example.com', owner: null },
    ]);
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({ id: 'new-user-id' });
    mockSendAccountActivationEmail.mockRejectedValueOnce(new Error('smtp'));

    const { bulkCreateAccountsAction } = await import('@/actions/bulk-users');
    const result = await bulkCreateAccountsAction({ apartmentIds: ['apt-1'] });

    expect(dataOf(result)).toEqual({ created: 1, skipped: 0, errors: 0 });
    expect(mockSendAccountActivationEmail).toHaveBeenCalledWith(
      'owner@example.com',
      expect.any(String),
      undefined
    );
  });
});
