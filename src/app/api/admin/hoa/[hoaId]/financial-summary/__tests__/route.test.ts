import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockApartmentFindMany = vi.fn();
const mockPaymentFindMany = vi.fn();
const mockChargeNotificationAggregate = vi.fn();

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: {
      findMany: mockApartmentFindMany,
    },
    payment: {
      findMany: mockPaymentFindMany,
    },
    chargeNotification: {
      aggregate: mockChargeNotificationAggregate,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

function makeRequest(): NextRequest {
  return new NextRequest(
    'http://localhost/api/admin/hoa/hoa-1/financial-summary'
  );
}

const adminSession = {
  user: { id: 'admin-id', email: 'admin@example.com', role: UserRole.ADMIN },
  expires: new Date().toISOString(),
};

describe('GET /api/admin/hoa/[hoaId]/financial-summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Brak uprawnień');
  });

  it('returns 401 when user is not admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'u', email: 'u@example.com', role: UserRole.TENANT },
      expires: new Date().toISOString(),
    });

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    await response.json();

    expect(response.status).toBe(401);
  });

  it('returns zeros when HOA has no apartments', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockResolvedValueOnce([]);

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalClosingBalance).toBe(0);
    expect(data.totalChargesDue).toBe(0);
    expect(mockPaymentFindMany).not.toHaveBeenCalled();
    expect(mockChargeNotificationAggregate).not.toHaveBeenCalled();
  });

  it('sums most recent closing balance per apartment', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1' },
      { id: 'apt-2' },
    ]);
    // apt-1 has 2025 and 2024; apt-2 has 2025
    mockPaymentFindMany.mockResolvedValueOnce([
      { apartmentId: 'apt-1', year: 2025, closingBalance: 100 },
      { apartmentId: 'apt-2', year: 2025, closingBalance: -50 },
      { apartmentId: 'apt-1', year: 2024, closingBalance: 200 }, // should be ignored
    ]);
    mockChargeNotificationAggregate.mockResolvedValueOnce({
      _sum: { totalAmount: 300 },
    });

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalClosingBalance).toBe(50); // 100 + (-50)
    expect(data.totalChargesDue).toBe(300);
  });

  it('uses zero for totalChargesDue when aggregate sum is null', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockResolvedValueOnce([{ id: 'apt-1' }]);
    mockPaymentFindMany.mockResolvedValueOnce([
      { apartmentId: 'apt-1', year: 2025, closingBalance: 500 },
    ]);
    mockChargeNotificationAggregate.mockResolvedValueOnce({
      _sum: { totalAmount: null },
    });

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalChargesDue).toBe(0);
  });

  it('handles apartments with no payments (not in payment list)', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockResolvedValueOnce([
      { id: 'apt-1' },
      { id: 'apt-no-payments' },
    ]);
    mockPaymentFindMany.mockResolvedValueOnce([
      { apartmentId: 'apt-1', year: 2025, closingBalance: 150 },
    ]);
    mockChargeNotificationAggregate.mockResolvedValueOnce({
      _sum: { totalAmount: 0 },
    });

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalClosingBalance).toBe(150);
  });

  it('queries payments ordered by year desc to get most recent first', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockResolvedValueOnce([{ id: 'apt-1' }]);
    mockPaymentFindMany.mockResolvedValueOnce([]);
    mockChargeNotificationAggregate.mockResolvedValueOnce({
      _sum: { totalAmount: 0 },
    });

    const { GET } = await import('../route');
    await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });

    expect(mockPaymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { year: 'desc' },
      })
    );
  });

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockRejectedValueOnce(new Error('DB failure'));

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Nie udało się pobrać podsumowania finansowego');
  });
});
