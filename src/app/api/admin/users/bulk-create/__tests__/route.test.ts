import { NextRequest } from 'next/server';
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
    user: { findUnique: mockUserFindUnique, create: mockUserCreate },
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

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

function makeRequest(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

function adminSession() {
  return {
    user: { id: 'admin-id', email: 'admin@example.com', role: UserRole.ADMIN },
    expires: new Date().toISOString(),
  };
}

describe('POST /api/admin/users/bulk-create', () => {
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

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Brak uprawnień');
  });

  it('should return 401 when user is not admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'u', email: 'u@e.com', role: UserRole.TENANT },
      expires: new Date().toISOString(),
    });

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));

    expect(response.status).toBe(401);
  });

  it('should return 400 when apartmentIds is empty', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: [] }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/apartmentIds/);
  });

  it('should return 400 when apartmentIds is missing', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());

    const { POST } = await import('../route');
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
  });

  it('should create a user for a single apartment', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'owner@example.com', owner: 'Jan Kowalski' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({ id: 'new-user-id' });

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));
    const data = await response.json();

    expect(response.status).toBe(200);
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

    const { POST } = await import('../route');
    const response = await POST(
      makeRequest({ apartmentIds: ['apt-1', 'apt-2'] })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
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

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));
    const data = await response.json();

    expect(response.status).toBe(200);
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

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));
    const data = await response.json();

    expect(response.status).toBe(200);
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

    const { POST } = await import('../route');
    const response = await POST(
      makeRequest({ apartmentIds: ['apt-1', 'apt-2'] })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ created: 2, skipped: 0, errors: 0 });
  });
});
