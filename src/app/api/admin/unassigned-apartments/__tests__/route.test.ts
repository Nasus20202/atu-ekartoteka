import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

const mockAuth = vi.fn();
const mockApartmentFindMany = vi.fn();
const mockUserFindMany = vi.fn();
const mockFindAssignedKeys = vi.fn();
const mockHoaFindMany = vi.fn();
const mockHoaCount = vi.fn();

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: {
      findMany: mockApartmentFindMany,
    },
    user: {
      findMany: mockUserFindMany,
    },
    homeownersAssociation: {
      findMany: mockHoaFindMany,
      count: mockHoaCount,
    },
  },
}));

vi.mock(
  '@/lib/queries/apartments/find-assigned-apartment-address-keys',
  () => ({
    findAssignedApartmentAddressKeys: mockFindAssignedKeys,
  })
);

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

function makeRequest(mode?: string, query = '') {
  const base = 'http://localhost/api/admin/unassigned-apartments';
  const url = mode
    ? `${base}?mode=${mode}${query.replace('?', '&')}`
    : `${base}${query}`;
  return new NextRequest(url);
}

const adminSession = {
  user: { id: 'admin-id', email: 'admin@example.com', role: UserRole.ADMIN },
  expires: new Date().toISOString(),
};

const mockApartments = [
  {
    id: 'apt-1',
    number: '101',
    building: 'A',
    owner: 'Jan Kowalski',
    email: 'jan@example.com',
    homeownersAssociation: { id: 'hoa-1', name: 'Wspólnota Alfa' },
  },
  {
    id: 'apt-2',
    number: '102',
    building: 'A',
    owner: 'Anna Nowak',
    email: 'anna@example.com',
    homeownersAssociation: { id: 'hoa-1', name: 'Wspólnota Alfa' },
  },
  {
    id: 'apt-3',
    number: '201',
    building: 'B',
    owner: 'Piotr Wiśniewski',
    email: 'piotr@example.com',
    homeownersAssociation: { id: 'hoa-2', name: 'Wspólnota Beta' },
  },
];

describe('GET /api/admin/unassigned-apartments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindMany.mockResolvedValue([]);
    mockHoaFindMany.mockResolvedValue([{ id: 'hoa-1' }, { id: 'hoa-2' }]);
    mockHoaCount.mockResolvedValue(2);
    // Default: no occupied address keys
    mockFindAssignedKeys.mockResolvedValue([]);
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import('../route');
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Brak uprawnień');
  });

  it('should return 401 when user is not admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-id', email: 'user@example.com', role: UserRole.TENANT },
      expires: new Date().toISOString(),
    });

    const { GET } = await import('../route');
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Brak uprawnień');
  });

  it('should return apartments grouped by HOA in creatable mode (default)', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockResolvedValueOnce(mockApartments);

    const { GET } = await import('../route');
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hoas).toHaveLength(2);

    const hoa1 = data.hoas.find((h: { hoaId: string }) => h.hoaId === 'hoa-1');
    expect(hoa1).toBeDefined();
    expect(hoa1.hoaName).toBe('Wspólnota Alfa');
    expect(hoa1.apartments).toHaveLength(2);

    const hoa2 = data.hoas.find((h: { hoaId: string }) => h.hoaId === 'hoa-2');
    expect(hoa2).toBeDefined();
    expect(hoa2.hoaName).toBe('Wspólnota Beta');
    expect(hoa2.apartments).toHaveLength(1);
  });

  it('sorts apartments numerically by building, then number', async () => {
    const apartment = (
      id: string,
      building: string | null,
      number: string
    ) => ({
      ...mockApartments[0],
      id,
      building,
      number,
    });
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockResolvedValueOnce([
      apartment('b2-10', '2', '10'),
      apartment('b2-9', '2', '9'),
      apartment('none-5', null, '5'),
      apartment('b1-3', '1', '3'),
    ]);

    const { GET } = await import('../route');
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(data.hoas[0].apartments.map((a: { id: string }) => a.id)).toEqual([
      'none-5',
      'b1-3',
      'b2-9',
      'b2-10',
    ]);
  });

  it('should query with notIn filter for creatable mode', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockUserFindMany.mockResolvedValueOnce([{ email: 'existing@example.com' }]);
    mockApartmentFindMany.mockResolvedValueOnce([]);

    const { GET } = await import('../route');
    await GET(makeRequest());

    expect(mockApartmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: null,
          email: { not: null, notIn: ['existing@example.com'] },
          homeownersAssociationId: { in: ['hoa-1', 'hoa-2'] },
        },
      })
    );
  });

  describe('pagination', () => {
    it('pages over HOAs and returns the pagination metadata', async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      mockHoaFindMany.mockResolvedValueOnce([{ id: 'hoa-1' }]);
      mockHoaCount.mockResolvedValueOnce(25);
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[0]]);

      const { GET } = await import('../route');
      const response = await GET(makeRequest(undefined, '?page=3&limit=10'));
      const data = await response.json();

      expect(mockHoaFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
      expect(data.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('loads apartments and twin keys only for the HOAs on the page', async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      mockHoaFindMany.mockResolvedValueOnce([{ id: 'hoa-2' }]);
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[2]]);

      const { GET } = await import('../route');
      await GET(makeRequest());

      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            homeownersAssociationId: { in: ['hoa-2'] },
          }),
        })
      );
      expect(mockFindAssignedKeys).toHaveBeenCalledWith(['hoa-2']);
    });

    it('defaults to the first page of 10 HOAs', async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      mockApartmentFindMany.mockResolvedValueOnce([]);

      const { GET } = await import('../route');
      const response = await GET(makeRequest());
      const data = await response.json();

      expect(mockHoaFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 })
      );
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('ignores invalid values and caps the page size', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockApartmentFindMany.mockResolvedValue([]);

      const { GET } = await import('../route');
      await GET(makeRequest(undefined, '?page=-2&limit=abc'));
      await GET(makeRequest(undefined, '?limit=5000'));

      expect(mockHoaFindMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ skip: 0, take: 10 })
      );
      expect(mockHoaFindMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ skip: 0, take: 100 })
      );
    });
  });

  it('should return empty hoas array when no unassigned apartments', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockApartmentFindMany.mockResolvedValueOnce([]);

    const { GET } = await import('../route');
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hoas).toEqual([]);
  });

  describe('hasTwinWithTenant tagging', () => {
    it('tags apartment as hasTwinWithTenant when its address key matches an assigned apartment', async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[0]]); // hoa-1, A, 101
      mockFindAssignedKeys.mockResolvedValueOnce([
        { hoaId: 'hoa-1', building: 'A', number: '101' },
      ]);

      const { GET } = await import('../route');
      const response = await GET(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      const apt = data.hoas[0].apartments[0];
      expect(apt.hasTwinWithTenant).toBe(true);
    });

    it('does not tag apartment when its address key does not match', async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[0]]); // hoa-1, A, 101
      mockFindAssignedKeys.mockResolvedValueOnce([
        { hoaId: 'hoa-1', building: 'A', number: '999' }, // different number
      ]);

      const { GET } = await import('../route');
      const response = await GET(makeRequest());
      const data = await response.json();

      const apt = data.hoas[0].apartments[0];
      expect(apt.hasTwinWithTenant).toBe(false);
    });

    it('handles null building in assigned keys (uses empty string in key)', async () => {
      const aptNullBuilding = {
        ...mockApartments[0],
        building: null,
        homeownersAssociation: { id: 'hoa-1', name: 'Wspólnota Alfa' },
      };
      mockAuth.mockResolvedValueOnce(adminSession);
      mockApartmentFindMany.mockResolvedValueOnce([aptNullBuilding]);
      mockFindAssignedKeys.mockResolvedValueOnce([
        { hoaId: 'hoa-1', building: null, number: '101' },
      ]);

      const { GET } = await import('../route');
      const response = await GET(makeRequest());
      const data = await response.json();

      const apt = data.hoas[0].apartments[0];
      expect(apt.hasTwinWithTenant).toBe(true);
    });
  });

  describe('mode=assignable', () => {
    it('should query with in filter matching existing user emails', async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      mockUserFindMany.mockResolvedValueOnce([
        { email: 'jan@example.com' },
        { email: 'anna@example.com' },
      ]);
      mockApartmentFindMany.mockResolvedValueOnce([]);

      const { GET } = await import('../route');
      await GET(makeRequest('assignable'));

      expect(mockApartmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: null,
            email: expect.objectContaining({
              in: ['jan@example.com', 'anna@example.com'],
            }),
          }),
        })
      );
    });

    it('should return apartments assignable to existing users grouped by HOA', async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      mockUserFindMany.mockResolvedValueOnce([{ email: 'jan@example.com' }]);
      mockApartmentFindMany.mockResolvedValueOnce([mockApartments[0]]);

      const { GET } = await import('../route');
      const response = await GET(makeRequest('assignable'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hoas).toHaveLength(1);
      expect(data.hoas[0].apartments[0].email).toBe('jan@example.com');
    });

    it('should return empty hoas when no assignable apartments', async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      mockUserFindMany.mockResolvedValueOnce([]);
      mockApartmentFindMany.mockResolvedValueOnce([]);

      const { GET } = await import('../route');
      const response = await GET(makeRequest('assignable'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hoas).toEqual([]);
    });
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValueOnce(adminSession);
    mockUserFindMany.mockRejectedValueOnce(new Error('DB failure'));

    const { GET } = await import('../route');
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
