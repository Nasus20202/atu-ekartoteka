import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma } from '@/generated/prisma/client';
import { UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockPaymentGroupBy = vi.fn();
const mockFindDerivedClosingTotal = vi.fn();
const mockChargeNotificationAggregate = vi.fn();

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    payment: {
      groupBy: mockPaymentGroupBy,
    },
    chargeNotification: {
      aggregate: mockChargeNotificationAggregate,
    },
  },
}));

vi.mock('@/lib/queries/payments/find-derived-closing-total', () => ({
  findDerivedClosingTotal: mockFindDerivedClosingTotal,
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

  it('returns zeros when HOA has no payments or notifications', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockPaymentGroupBy.mockResolvedValueOnce([]);
    mockFindDerivedClosingTotal.mockResolvedValueOnce(new Prisma.Decimal(0));
    mockChargeNotificationAggregate.mockResolvedValueOnce({
      _sum: { totalAmount: null },
    });

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalClosingBalance).toBe(0);
    expect(data.totalChargesDue).toBe(0);
    expect(mockFindDerivedClosingTotal.mock.calls[0][0].size).toBe(0);
  });

  it('totals the derived closing balance of each apartment latest year', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockPaymentGroupBy.mockResolvedValueOnce([
      { apartmentId: 'apt-1', _max: { year: 2025 } },
      { apartmentId: 'apt-2', _max: { year: 2024 } },
      { apartmentId: 'apt-3', _max: { year: 2025 } },
    ]);
    mockFindDerivedClosingTotal.mockResolvedValueOnce(new Prisma.Decimal(50));
    mockChargeNotificationAggregate.mockResolvedValueOnce({
      _sum: { totalAmount: 300 },
    });

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    const inHoa = { apartment: { homeownersAssociationId: 'hoa-1' } };
    expect(response.status).toBe(200);
    expect(data).toEqual({ totalClosingBalance: 50, totalChargesDue: 300 });
    expect(mockPaymentGroupBy).toHaveBeenCalledWith({
      by: ['apartmentId'],
      where: inHoa,
      _max: { year: true },
    });
    expect(mockFindDerivedClosingTotal).toHaveBeenCalledWith(
      new Map([
        [2025, ['apt-1', 'apt-3']],
        [2024, ['apt-2']],
      ]),
      expect.stringMatching(/^\d{6}$/)
    );
    expect(mockChargeNotificationAggregate).toHaveBeenCalledWith({
      where: inHoa,
      _sum: { totalAmount: true },
    });
  });

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockPaymentGroupBy.mockRejectedValueOnce(new Error('DB failure'));

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Nie udało się pobrać podsumowania finansowego');
  });

  it('reports non-Error failures as unknown errors', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockPaymentGroupBy.mockRejectedValueOnce('DB failure');

    const { GET } = await import('../route');
    const response = await GET(makeRequest(), {
      params: Promise.resolve({ hoaId: 'hoa-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Nie udało się pobrać podsumowania finansowego');
    expect(data.message).toBe('Nieznany błąd');
  });
});
