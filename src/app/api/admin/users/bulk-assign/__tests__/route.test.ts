import { NextRequest } from 'next/server';
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

describe('POST /api/admin/users/bulk-assign', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
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

  it('should assign existing user to apartment', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'tenant@example.com' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user-id' });
    mockApartmentUpdateMany.mockResolvedValueOnce({ count: 1 });

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));
    const data = await response.json();

    expect(response.status).toBe(200);
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

    const { POST } = await import('../route');
    const response = await POST(
      makeRequest({ apartmentIds: ['apt-1', 'apt-2'] })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
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

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));
    const data = await response.json();

    expect(response.status).toBe(200);
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

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ assigned: 0, skipped: 1, errors: 0 });
  });

  it('should track errors when DB transaction fails', async () => {
    mockAuth.mockResolvedValueOnce(adminSession());
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1', email: 'tenant@example.com' },
    ]);
    mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user-id' });
    mockTransaction.mockRejectedValueOnce(new Error('DB error'));

    const { POST } = await import('../route');
    const response = await POST(makeRequest({ apartmentIds: ['apt-1'] }));
    const data = await response.json();

    expect(response.status).toBe(200);
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

    const { POST } = await import('../route');
    const response = await POST(
      makeRequest({ apartmentIds: ['apt-1', 'apt-2'] })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ assigned: 2, skipped: 0, errors: 0 });
  });
});
