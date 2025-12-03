import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/lib/types';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/auth';
const mockAuth = vi.mocked(auth);

const mockApartmentFindUnique = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: {
      findUnique: mockApartmentFindUnique,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Admin Apartment Detail API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/apartments/[apartmentId]', () => {
    const mockApartment = {
      id: 'apt-1',
      number: '101',
      building: 'A',
      owner: 'Jan Kowalski',
      email: 'jan@example.com',
      address: 'ul. Testowa 1',
      city: 'Warszawa',
      homeownersAssociation: {
        id: 'hoa-1',
        externalId: 'HOA-001',
        name: 'Wspólnota A',
      },
      user: {
        id: 'user-1',
        name: 'Jan Kowalski',
        email: 'jan@example.com',
      },
      charges: [{ id: 'charge-1', period: '2024-01', amount: 500.0 }],
      chargeNotifications: [{ id: 'notif-1', lineNo: 1, content: 'Test' }],
      payments: [{ id: 'payment-1', year: 2024, amount: 6000.0 }],
    };

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null as any);

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when user is not admin', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.TENANT,
        },
        expires: new Date().toISOString(),
      } as any);

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return apartment with all relations', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      mockApartmentFindUnique.mockResolvedValueOnce(mockApartment);

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('apt-1');
      expect(data.homeownersAssociation).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.charges).toBeDefined();
      expect(data.chargeNotifications).toBeDefined();
      expect(data.payments).toBeDefined();
    });

    it('should return 404 when apartment not found', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      mockApartmentFindUnique.mockResolvedValueOnce(null);

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'nonexistent' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Apartment not found');
    });

    it('should include homeownersAssociation details', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      mockApartmentFindUnique.mockResolvedValueOnce(mockApartment);

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(data.homeownersAssociation).toEqual({
        id: 'hoa-1',
        externalId: 'HOA-001',
        name: 'Wspólnota A',
      });
    });

    it('should include user details', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      mockApartmentFindUnique.mockResolvedValueOnce(mockApartment);

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(data.user).toEqual({
        id: 'user-1',
        name: 'Jan Kowalski',
        email: 'jan@example.com',
      });
    });

    it('should include charges sorted by period', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      mockApartmentFindUnique.mockResolvedValueOnce(mockApartment);

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(data.charges).toHaveLength(1);
      expect(data.charges[0].period).toBe('2024-01');
    });

    it('should handle apartment without user', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      mockApartmentFindUnique.mockResolvedValueOnce({
        ...mockApartment,
        user: null,
      });

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      mockApartmentFindUnique.mockRejectedValueOnce(
        new Error('Database error')
      );

      const { GET } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });

      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
