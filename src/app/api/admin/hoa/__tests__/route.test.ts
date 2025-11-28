import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    homeownersAssociation: {
      findMany: vi.fn(),
      update: vi.fn(),
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

const { auth } = await import('@/auth');
const { prisma } = await import('@/lib/database/prisma');

function createMockRequest(
  searchParams?: Record<string, string>,
  body?: any
): NextRequest {
  const url = new URL('http://localhost/api/admin/hoa');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return {
    json: async () => body,
    url: url.toString(),
  } as NextRequest;
}

describe('Admin HOA API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/hoa', () => {
    const mockHOAs = [
      {
        id: 'hoa-1',
        externalId: 'EXT-001',
        name: 'Wspólnota A',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { apartments: 10 },
      },
      {
        id: 'hoa-2',
        externalId: 'EXT-002',
        name: 'Wspólnota B',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        _count: { apartments: 5 },
      },
    ];

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return 401 when user is not admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return all HOAs when no search parameter', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.findMany).mockResolvedValueOnce(
        mockHOAs
      );

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.homeownersAssociations).toHaveLength(2);
      expect(data.homeownersAssociations[0].apartmentCount).toBe(10);
      expect(data.homeownersAssociations[1].apartmentCount).toBe(5);
      expect(prisma.homeownersAssociation.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: {
            select: {
              apartments: { where: { isActive: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should filter HOAs by name (case insensitive)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.findMany).mockResolvedValueOnce([
        mockHOAs[0],
      ]);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'wspólnota a' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.homeownersAssociations).toHaveLength(1);
      expect(prisma.homeownersAssociation.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'wspólnota a', mode: 'insensitive' } },
            { externalId: { contains: 'wspólnota a', mode: 'insensitive' } },
          ],
        },
        include: {
          _count: {
            select: {
              apartments: { where: { isActive: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should filter HOAs by externalId', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.findMany).mockResolvedValueOnce([
        mockHOAs[0],
      ]);

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'EXT-001' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.homeownersAssociations).toHaveLength(1);
      expect(data.homeownersAssociations[0].externalId).toBe('EXT-001');
    });

    it('should include apartment count in response', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.findMany).mockResolvedValueOnce(
        mockHOAs
      );

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      data.homeownersAssociations.forEach((hoa: any) => {
        expect(hoa).toHaveProperty('apartmentCount');
        expect(typeof hoa.apartmentCount).toBe('number');
      });
    });

    it('should sort HOAs by name ascending', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.findMany).mockResolvedValueOnce(
        mockHOAs
      );

      const { GET } = await import('../route');
      const request = createMockRequest();

      await GET(request);

      expect(prisma.homeownersAssociation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.findMany).mockRejectedValueOnce(
        new Error('Database error')
      );

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Nie udało się pobrać wspólnot');
    });

    it('should return correct response schema', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.findMany).mockResolvedValueOnce(
        mockHOAs
      );

      const { GET } = await import('../route');
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('homeownersAssociations');
      expect(Array.isArray(data.homeownersAssociations)).toBe(true);
      expect(data.homeownersAssociations[0]).toHaveProperty('id');
      expect(data.homeownersAssociations[0]).toHaveProperty('externalId');
      expect(data.homeownersAssociations[0]).toHaveProperty('name');
      expect(data.homeownersAssociations[0]).toHaveProperty('apartmentCount');
      expect(data.homeownersAssociations[0]).toHaveProperty('createdAt');
      expect(data.homeownersAssociations[0]).toHaveProperty('updatedAt');
    });

    it('should return empty array when no HOAs found', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.findMany).mockResolvedValueOnce(
        []
      );

      const { GET } = await import('../route');
      const request = createMockRequest({ search: 'nonexistent' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.homeownersAssociations).toEqual([]);
    });
  });

  describe('PATCH /api/admin/hoa', () => {
    const mockHOA = {
      id: 'hoa-1',
      externalId: 'EXT-001',
      name: 'Updated Name',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    };

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const { PATCH } = await import('../route');
      const request = createMockRequest(undefined, {
        id: 'hoa-1',
        name: 'New Name',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return 401 when user is not admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);

      const { PATCH } = await import('../route');
      const request = createMockRequest(undefined, {
        id: 'hoa-1',
        name: 'New Name',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Brak uprawnień');
    });

    it('should return 400 when id is missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { PATCH } = await import('../route');
      const request = createMockRequest(undefined, { name: 'New Name' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Brak wymaganych pól');
    });

    it('should return 400 when name is missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { PATCH } = await import('../route');
      const request = createMockRequest(undefined, { id: 'hoa-1' });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Brak wymaganych pól');
    });

    it('should update HOA name successfully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.update).mockResolvedValueOnce(
        mockHOA
      );

      const { PATCH } = await import('../route');
      const request = createMockRequest(undefined, {
        id: 'hoa-1',
        name: 'Updated Name',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.homeownersAssociation.name).toBe('Updated Name');
      expect(prisma.homeownersAssociation.update).toHaveBeenCalledWith({
        where: { id: 'hoa-1' },
        data: { name: 'Updated Name' },
      });
    });

    it('should handle non-existent HOA', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.update).mockRejectedValueOnce(
        new Error('Record not found')
      );

      const { PATCH } = await import('../route');
      const request = createMockRequest(undefined, {
        id: 'nonexistent',
        name: 'New Name',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Nie udało się zaktualizować wspólnoty');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      vi.mocked(prisma.homeownersAssociation.update).mockRejectedValueOnce(
        new Error('Database error')
      );

      const { PATCH } = await import('../route');
      const request = createMockRequest(undefined, {
        id: 'hoa-1',
        name: 'New Name',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Nie udało się zaktualizować wspólnoty');
      expect(data.message).toBe('Database error');
    });
  });
});
