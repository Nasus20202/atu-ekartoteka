import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockFindMany = vi.fn();
const mockUpsert = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/auth', () => ({ auth: mockAuth }));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    appSetting: { findMany: mockFindMany, upsert: mockUpsert },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const { GET, PUT } = await import('@/app/api/admin/settings/route');

function putRequest(body: unknown): NextRequest {
  return { json: async () => body } as NextRequest;
}

const ADMIN_SESSION = { user: { id: 'admin-1', role: UserRole.ADMIN } };
const TENANT_SESSION = { user: { id: 'user-1', role: UserRole.TENANT } };

describe('Admin settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(ADMIN_SESSION);
  });

  describe('GET', () => {
    it('returns the stored setting', async () => {
      mockFindMany.mockResolvedValue([
        { key: 'tenantHistoryYearsBack', value: 3 },
      ]);

      const response = await GET();

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        tenantHistoryYearsBack: 3,
      });
    });

    it('rejects non-admins', async () => {
      mockAuth.mockResolvedValue(TENANT_SESSION);

      const response = await GET();

      expect(response.status).toBe(401);
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it('returns 500 when the query fails', async () => {
      mockFindMany.mockRejectedValue(new Error('db down'));

      const response = await GET();

      expect(response.status).toBe(500);
    });
  });

  describe('PUT', () => {
    it('stores a valid value', async () => {
      mockTransaction.mockResolvedValue([]);
      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ key: 'tenantHistoryYearsBack', value: 1 }]);

      const response = await PUT(putRequest({ tenantHistoryYearsBack: 1 }));

      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { key: 'tenantHistoryYearsBack' },
        create: { key: 'tenantHistoryYearsBack', value: 1 },
        update: { value: 1 },
      });
      await expect(response.json()).resolves.toEqual({
        tenantHistoryYearsBack: 1,
      });
    });

    it.each([
      { tenantHistoryYearsBack: -1 },
      { tenantHistoryYearsBack: 21 },
      { tenantHistoryYearsBack: 1.5 },
      { tenantHistoryYearsBack: '2' },
      { unknownSetting: 1 },
      {},
    ])('rejects invalid body %o', async (body) => {
      const response = await PUT(putRequest(body));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'Nieprawidłowe ustawienia',
      });
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('rejects a body that is not valid JSON', async () => {
      const request = {
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      } as unknown as NextRequest;

      const response = await PUT(request);

      expect(response.status).toBe(400);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await PUT(putRequest({ tenantHistoryYearsBack: 1 }));

      expect(response.status).toBe(401);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('returns 500 when saving fails', async () => {
      mockFindMany.mockResolvedValue([]);
      mockTransaction.mockRejectedValue(new Error('db down'));

      const response = await PUT(putRequest({ tenantHistoryYearsBack: 1 }));

      expect(response.status).toBe(500);
    });
  });
});
