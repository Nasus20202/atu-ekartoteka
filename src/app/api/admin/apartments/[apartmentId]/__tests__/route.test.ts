import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma } from '@/generated/prisma/browser';
import { UserRole } from '@/lib/types';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/auth';
const mockAuth = vi.mocked(auth);

const mockApartmentFindUnique = vi.fn();
const mockApartmentUpdate = vi.fn();

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    apartment: {
      findUnique: mockApartmentFindUnique,
      update: mockApartmentUpdate,
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
      externalOwnerId: 'owner-1',
      externalApartmentId: 'apartment-1',
      number: '101',
      building: 'A',
      owner: 'Jan Kowalski',
      email: 'jan@example.com',
      address: 'ul. Testowa 1',
      postalCode: '00-001',
      city: 'Warszawa',
      shareNumerator: 1,
      shareDenominator: 10,
      isActive: true,
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
      charges: [
        {
          id: 'charge-1',
          description: 'Czynsz',
          quantity: new Prisma.Decimal('1.0000'),
          unit: 'szt',
          unitPrice: new Prisma.Decimal('500.0000'),
          totalAmount: new Prisma.Decimal('500.0000'),
          period: '2024-01',
          dateFrom: new Date('2024-01-01T00:00:00.000Z'),
          dateTo: new Date('2024-01-31T00:00:00.000Z'),
        },
      ],
      chargeNotifications: [
        {
          id: 'notif-1',
          lineNo: 1,
          description: 'Test',
          quantity: new Prisma.Decimal('1.0000'),
          unit: 'szt',
          unitPrice: new Prisma.Decimal('500.0000'),
          totalAmount: new Prisma.Decimal('500.0000'),
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
      ],
      payments: [
        {
          id: 'payment-1',
          apartmentId: 'apt-1',
          year: 2024,
          dateFrom: new Date('2024-01-01T00:00:00.000Z'),
          dateTo: new Date('2024-12-31T00:00:00.000Z'),
          openingBalance: new Prisma.Decimal('0.0000'),
          closingBalance: new Prisma.Decimal('6000.0000'),
          openingDebt: new Prisma.Decimal('0.0000'),
          openingSurplus: new Prisma.Decimal('0.0000'),
          januaryPayments: new Prisma.Decimal('500.0000'),
          februaryPayments: new Prisma.Decimal('500.0000'),
          marchPayments: new Prisma.Decimal('500.0000'),
          aprilPayments: new Prisma.Decimal('500.0000'),
          mayPayments: new Prisma.Decimal('500.0000'),
          junePayments: new Prisma.Decimal('500.0000'),
          julyPayments: new Prisma.Decimal('500.0000'),
          augustPayments: new Prisma.Decimal('500.0000'),
          septemberPayments: new Prisma.Decimal('500.0000'),
          octoberPayments: new Prisma.Decimal('500.0000'),
          novemberPayments: new Prisma.Decimal('500.0000'),
          decemberPayments: new Prisma.Decimal('500.0000'),
          januaryCharges: new Prisma.Decimal('0.0000'),
          februaryCharges: new Prisma.Decimal('0.0000'),
          marchCharges: new Prisma.Decimal('0.0000'),
          aprilCharges: new Prisma.Decimal('0.0000'),
          mayCharges: new Prisma.Decimal('0.0000'),
          juneCharges: new Prisma.Decimal('0.0000'),
          julyCharges: new Prisma.Decimal('0.0000'),
          augustCharges: new Prisma.Decimal('0.0000'),
          septemberCharges: new Prisma.Decimal('0.0000'),
          octoberCharges: new Prisma.Decimal('0.0000'),
          novemberCharges: new Prisma.Decimal('0.0000'),
          decemberCharges: new Prisma.Decimal('0.0000'),
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ],
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
      expect(data.charges[0].totalAmount).toBe('500');
      expect(data.payments[0].openingBalance).toBe('0');
      expect(data.chargeNotifications[0].quantity).toBe('1');
      expect(data.chargeNotifications[0].unitPrice).toBe('500');
      expect(data.chargeNotifications[0].totalAmount).toBe('500');
      expect(data.chargeNotifications[0].createdAt).toBe(
        '2024-01-01T00:00:00.000Z'
      );
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

  describe('PATCH /api/admin/apartments/[apartmentId]', () => {
    const mockUpdatedApartment = {
      id: 'apt-1',
      number: '101',
      building: 'A',
      isActive: false,
    };

    function createPatchRequest(body: unknown): NextRequest {
      return {
        json: () => Promise.resolve(body),
      } as unknown as NextRequest;
    }

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null as any);

      const { PATCH } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });
      const request = createPatchRequest({ isActive: false });

      const response = await PATCH(request, { params });
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

      const { PATCH } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });
      const request = createPatchRequest({ isActive: false });

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when isActive is not a boolean', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);

      const { PATCH } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });
      const request = createPatchRequest({ isActive: 'yes' });

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should update apartment isActive and return updated apartment', async () => {
      mockAuth.mockResolvedValueOnce({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        expires: new Date().toISOString(),
      } as any);
      mockApartmentUpdate.mockResolvedValueOnce(mockUpdatedApartment);

      const { PATCH } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });
      const request = createPatchRequest({ isActive: false });

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isActive).toBe(false);
      expect(data).not.toHaveProperty('homeownersAssociationId');
      expect(mockApartmentUpdate).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { isActive: false },
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
      } as any);
      mockApartmentUpdate.mockRejectedValueOnce(new Error('Database error'));

      const { PATCH } = await import('../route');
      const params = Promise.resolve({ apartmentId: 'apt-1' });
      const request = createPatchRequest({ isActive: true });

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
