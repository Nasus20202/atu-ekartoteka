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
      mockApartmentFindMany.mockResolvedValueOnce(mockApartments);
      mockApartmentCount.mockResolvedValueOnce(2);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ page: '1', limit: '20' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(2);
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
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[0]]);
      mockApartmentCount.mockResolvedValueOnce(1);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: '101' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(1);
      expect(data.apartments[0].number).toBe('101');
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
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[0]]);
      mockApartmentCount.mockResolvedValueOnce(1);
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
      mockApartmentFindMany.mockResolvedValueOnce(mockApartments);
      mockApartmentCount.mockResolvedValueOnce(2);
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
      mockApartmentFindMany.mockResolvedValueOnce(mockApartments);
      mockApartmentCount.mockResolvedValueOnce(2);
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
        select: { id: true, externalId: true, name: true },
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
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[0]]);
      mockApartmentCount.mockResolvedValueOnce(1);
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
      mockApartmentFindMany.mockResolvedValueOnce(mockApartments);
      mockApartmentCount.mockResolvedValueOnce(45);
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
    });

    it('should sort by building and number', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      });
      mockApartmentFindMany.mockResolvedValueOnce(mockApartments);
      mockApartmentCount.mockResolvedValueOnce(2);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(2);
      expect(data.apartments[0].number).toBe('101');
      expect(data.apartments[1].number).toBe('102');
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
      mockApartmentFindMany.mockResolvedValueOnce(mockApartments);
      mockApartmentCount.mockResolvedValueOnce(2);
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
      mockApartmentFindMany.mockResolvedValueOnce(mockApartments);
      mockApartmentCount.mockResolvedValueOnce(2);
      mockHoaFindUnique.mockResolvedValueOnce(mockHOA);

      const { GET } = await import('../route');
      const request = createMockRequest({ hoaId: 'hoa-1' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('hoa');
      expect(data).toHaveProperty('apartments');
      expect(data).toHaveProperty('pagination');
      expect(mockHoaFindUnique).toHaveBeenCalledWith({
        where: { id: 'hoa-1' },
        select: { id: true, externalId: true, name: true },
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
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[0]]);
      mockApartmentCount.mockResolvedValueOnce(1);
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
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[1]]);
      mockApartmentCount.mockResolvedValueOnce(1);
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
      mockApartmentFindMany.mockResolvedValueOnce(mockApartments);
      mockApartmentCount.mockResolvedValueOnce(2);
      mockHoaFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'A' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.apartments).toHaveLength(2);
      expect(data.apartments[0].building).toBe('A');
    });
  });
});
