import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockApartmentFindMany = vi.fn();
const mockApartmentCount = vi.fn();
const mockHoaFindUnique = vi.fn();

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: {
      findMany: mockApartmentFindMany,
      count: mockApartmentCount,
    },
    homeownersAssociation: {
      findUnique: mockHoaFindUnique,
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

// The database returns the requested page; the count query returns the total
function mockApartmentRows(
  rows: Record<string, unknown>[],
  total = rows.length
) {
  mockApartmentFindMany.mockResolvedValue(rows);
  mockApartmentCount.mockResolvedValue(total);
}

function createMockRequest(searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/admin/apartments');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return {
    url: url.toString(),
  } as NextRequest;
}

describe('Admin Apartments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/apartments', () => {
    const mockApartments = [
      {
        id: 'apt-1',
        number: '101',
        building: 'A',
        owner: 'Jan Kowalski',
        address: 'ul. Testowa 1',
        city: 'Warszawa',
        isActive: true,
        homeownersAssociationId: 'hoa-1',
        externalOwnerId: 'W00123',
        externalApartmentId: 'HOA1-00001',
      },
      {
        id: 'apt-2',
        number: '102',
        building: 'A',
        owner: 'Anna Nowak',
        address: 'ul. Testowa 2',
        city: 'Warszawa',
        isActive: true,
        homeownersAssociationId: 'hoa-1',
        externalOwnerId: 'W00456',
        externalApartmentId: 'HOA1-00002',
      },
    ];

    const mockHOA = {
      id: 'hoa-1',
      externalId: 'EXT-001',
      name: 'Wspólnota A',
      header: 'Nagłówek',
      footer: null,
    };

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return 401 when user is not admin', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      });

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return paginated apartments', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ page: '1', limit: '20' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(2);
      expect(data.apartments[0]).not.toHaveProperty('homeownersAssociationId');
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter by search term (number)', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows([mockApartments[0]]);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: '101' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(1);
      expect(data.apartments[0].number).toBe('101');
      expect(data.apartments[0]).not.toHaveProperty('homeownersAssociationId');
    });

    it('should filter by search term (owner)', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows([mockApartments[0]]);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'Kowalski' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(1);
      expect(data.apartments[0].owner).toContain('Kowalski');
    });

    it('should filter by activeOnly flag', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ activeOnly: 'true' });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ isActive: true }),
            ]),
          }),
        })
      );
    });

    it('should filter by hoaId', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);
      mockHoaFindUnique.mockResolvedValueOnce(mockHOA);

      const { GET } = await import('../route');
      const request = createMockRequest({ hoaId: 'hoa-1' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('hoa');
      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ homeownersAssociationId: 'hoa-1' }]),
          }),
        })
      );
      expect(mockHoaFindUnique).toHaveBeenCalledWith({
        where: { id: 'hoa-1' },
        select: {
          id: true,
          externalId: true,
          name: true,
          header: true,
          footer: true,
        },
      });
    });

    it('should combine multiple filters', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows([mockApartments[0]]);
      mockHoaFindUnique.mockResolvedValueOnce(mockHOA);

      const { GET } = await import('../route');
      const request = createMockRequest({
        hoaId: 'hoa-1',
        activeOnly: 'true',
        search: 'Kowalski',
      });

      await GET(request);

      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { homeownersAssociationId: 'hoa-1' },
              { isActive: true },
              expect.objectContaining({
                OR: expect.any(Array),
              }),
            ]),
          }),
        })
      );
    });

    it('should return correct pagination metadata', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      const pageRows = Array.from({ length: 20 }, (_, i) => ({
        ...mockApartments[0],
        id: `apt-${i + 20}`,
        number: String(i + 21),
      }));
      mockApartmentRows(pageRows, 45);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ page: '2', limit: '20' });

      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      });
      expect(data.apartments.map((a: { id: string }) => a.id)).toEqual(
        Array.from({ length: 20 }, (_, i) => `apt-${i + 20}`)
      );
      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 })
      );
    });

    it('should sort by building and number by default', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { building: { sort: 'asc', nulls: 'first' } },
            { number: 'asc' },
            { id: 'asc' },
          ],
        })
      );
    });

    it('passes the requested sort column and direction to the database', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);

      const { GET } = await import('../route');
      const response = await GET(
        createMockRequest({ sort: 'owner', order: 'desc' })
      );

      expect(response.status).toBe(200);
      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([
            { owner: { sort: 'desc', nulls: 'last' } },
          ]),
        })
      );
    });

    it('ignores an unknown sort column and keeps the natural order', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);

      const { GET } = await import('../route');
      const response = await GET(createMockRequest({ sort: 'createdAt' }));

      expect(response.status).toBe(200);
      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { building: { sort: 'asc', nulls: 'first' } },
            { number: 'asc' },
            { id: 'asc' },
          ],
        })
      );
    });

    it('should handle invalid pagination parameters', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ page: 'invalid', limit: 'invalid' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should default to page 1, limit 20 (NaN becomes 1 for page, 20 for limit)
      expect(data.pagination).toBeDefined();
      expect(data.apartments).toHaveLength(2);
    });

    it('should include HOA details when hoaId provided', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);
      mockHoaFindUnique.mockReset();
      mockHoaFindUnique.mockResolvedValueOnce(mockHOA);

      const { GET } = await import('../route');
      const request = createMockRequest({ hoaId: 'hoa-1' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hoa).toEqual(mockHOA);
      expect(data).toHaveProperty('apartments');
      expect(data).toHaveProperty('pagination');
      expect(mockHoaFindUnique).toHaveBeenCalledWith({
        where: { id: 'hoa-1' },
        select: {
          id: true,
          externalId: true,
          name: true,
          header: true,
          footer: true,
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentFindMany.mockRejectedValueOnce(new Error('Database error'));

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Nie udało się pobrać mieszkań');
    });

    it('should filter by search term (externalOwnerId)', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows([mockApartments[0]]);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'W00123' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(1);
      expect(data.apartments[0].externalOwnerId).toBe('W00123');
    });

    it('should filter by search term (externalApartmentId)', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows([mockApartments[1]]);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'HOA1-00002' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(1);
      expect(data.apartments[0].externalApartmentId).toBe('HOA1-00002');
    });

    it('should filter by search term (building)', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'A' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(2);
      expect(data.apartments[0].building).toBe('A');
    });

    it('should filter by slash-search (building/number)', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows([mockApartments[0]]);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'A/101' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                AND: [
                  {
                    OR: [{ building: { contains: 'A', mode: 'insensitive' } }],
                  },
                  { number: { contains: '101', mode: 'insensitive' } },
                ],
              }),
            ]),
          }),
        })
      );
      expect(data.apartments).toHaveLength(1);
    });

    it('should handle slash-search with only building part', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentRows(mockApartments);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'A/' });

      await GET(request);

      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                AND: [
                  {
                    OR: [{ building: { contains: 'A', mode: 'insensitive' } }],
                  },
                  {},
                ],
              }),
            ]),
          }),
        })
      );
    });

    describe('edge cases', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValueOnce({
          user: { id: 'admin-id', role: UserRole.ADMIN },
        });
      });

      it('handles slash-search with only the number part', async () => {
        mockApartmentRows([]);

        const { GET } = await import('../route');
        await GET(createMockRequest({ search: '/12' }));

        expect(mockApartmentFindMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              AND: expect.arrayContaining([
                expect.objectContaining({
                  AND: [
                    {},
                    { number: { contains: '12', mode: 'insensitive' } },
                  ],
                }),
              ]),
            }),
          })
        );
      });

      it('sorts by building first, treating a missing building as empty', async () => {
        mockApartmentRows([
          { ...mockApartments[0], id: 'b', building: 'B', number: '1' },
          { ...mockApartments[0], id: 'none', building: null, number: '5' },
          { ...mockApartments[0], id: 'a', building: 'A', number: '2' },
        ]);

        const { GET } = await import('../route');
        const response = await GET(createMockRequest());

        expect(response.status).toBe(200);
        expect(mockApartmentFindMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [
              { building: { sort: 'asc', nulls: 'first' } },
              { number: 'asc' },
              { id: 'asc' },
            ],
          })
        );
      });

      it('returns the HOA summary for a hoaId filter', async () => {
        mockApartmentRows([]);
        mockHoaFindUnique.mockReset();
        mockHoaFindUnique.mockResolvedValue(mockHOA);

        const { GET } = await import('../route');
        const response = await GET(createMockRequest({ hoaId: 'hoa-1' }));

        await expect(response.json()).resolves.toMatchObject({
          hoa: mockHOA,
        });
      });

      it('reports non-Error failures as unknown errors', async () => {
        mockApartmentFindMany.mockRejectedValueOnce('boom');

        const { GET } = await import('../route');
        const response = await GET(createMockRequest());

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toMatchObject({
          message: 'Nieznany błąd',
        });
      });
    });
  });
});
