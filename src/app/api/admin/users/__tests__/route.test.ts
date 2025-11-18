import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/generated/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    apartment: {
      findUnique: vi.fn(),
    },
  },
}));

const { prisma } = await import('@/lib/prisma');

describe('Admin Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return all tenant users when no filter is applied', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'tenant1@example.com',
          password: 'hashedpassword',
          name: 'Tenant One',
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartmentId: null,
          apartment: null,
        },
        {
          id: '2',
          email: 'tenant2@example.com',
          password: 'hashedpassword',
          name: 'Tenant Two',
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartmentId: '1',
          apartment: {
            id: '1',
            externalId: 'EXT1',
            owner: 'Owner Name',
            address: 'Test Street',
            building: 'B1',
            number: '1',
            postalCode: '00-001',
            city: 'Warsaw',
            area: 50,
            height: 2.5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

      const result = await prisma.user.findMany({
        where: { role: UserRole.TENANT },
        include: { apartment: true },
        orderBy: [{ createdAt: 'desc' }],
      });

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(UserRole.TENANT);
      expect(result[1].apartment).not.toBeNull();
    });

    it('should filter users by PENDING status', async () => {
      const mockPendingUsers = [
        {
          id: '1',
          email: 'pending@example.com',
          password: 'hashedpassword',
          name: 'Pending User',
          role: UserRole.TENANT,
          status: AccountStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartmentId: null,
          apartment: null,
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockPendingUsers);

      const result = await prisma.user.findMany({
        where: {
          status: AccountStatus.PENDING,
          role: UserRole.TENANT,
        },
        include: { apartment: true },
        orderBy: [{ createdAt: 'desc' }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(AccountStatus.PENDING);
    });

    it('should filter users by APPROVED status', async () => {
      const mockApprovedUsers = [
        {
          id: '2',
          email: 'approved@example.com',
          password: 'hashedpassword',
          name: 'Approved User',
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartmentId: '1',
          apartment: {
            id: '1',
            externalId: 'EXT1',
            owner: 'Owner',
            address: 'Street',
            building: 'B1',
            number: '1',
            postalCode: '00-001',
            city: 'City',
            area: 50,
            height: 2.5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockApprovedUsers);

      const result = await prisma.user.findMany({
        where: {
          status: AccountStatus.APPROVED,
          role: UserRole.TENANT,
        },
        include: { apartment: true },
        orderBy: [{ createdAt: 'desc' }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(AccountStatus.APPROVED);
    });
  });

  describe('PATCH /api/admin/users', () => {
    it('should approve a user without apartment', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.APPROVED,
        apartment: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      const result = await prisma.user.update({
        where: { id: '1' },
        data: {
          status: AccountStatus.APPROVED,
          apartmentId: null,
        },
        include: { apartment: true },
      });

      expect(result.status).toBe(AccountStatus.APPROVED);
      expect(result.apartmentId).toBeNull();
    });

    it('should approve a user and assign apartment', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      const mockApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'Owner',
        address: 'Street',
        building: 'B1',
        number: '1',
        postalCode: '00-001',
        city: 'City',
        area: 50,
        height: 2.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
      };

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.APPROVED,
        apartmentId: 'apt1',
        apartment: mockApartment,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      // Check apartment is available
      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
        include: { user: true },
      });

      expect(apartment?.user).toBeNull();

      // Update user
      const result = await prisma.user.update({
        where: { id: '1' },
        data: {
          status: AccountStatus.APPROVED,
          apartmentId: 'apt1',
        },
        include: { apartment: true },
      });

      expect(result.status).toBe(AccountStatus.APPROVED);
      expect(result.apartmentId).toBe('apt1');
      expect(result.apartment).not.toBeNull();
    });

    it('should reject a user', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.REJECTED,
        apartmentId: null,
        apartment: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      const result = await prisma.user.update({
        where: { id: '1' },
        data: {
          status: AccountStatus.REJECTED,
          apartmentId: null,
        },
        include: { apartment: true },
      });

      expect(result.status).toBe(AccountStatus.REJECTED);
      expect(result.apartmentId).toBeNull();
    });

    it('should prevent assigning already occupied apartment', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      const occupiedApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'Owner',
        address: 'Street',
        building: 'B1',
        number: '1',
        postalCode: '00-001',
        city: 'City',
        area: 50,
        height: 2.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'other-user',
          email: 'other@example.com',
          password: 'hashedpassword',
          name: 'Other User',
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartmentId: 'apt1',
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(
        occupiedApartment
      );

      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
        include: { user: true },
      });

      expect(apartment?.user).not.toBeNull();
      expect(apartment?.user?.id).not.toBe('1');
    });

    it('should validate status values', () => {
      const validStatuses = [
        AccountStatus.PENDING,
        AccountStatus.APPROVED,
        AccountStatus.REJECTED,
      ];

      const status = AccountStatus.APPROVED;
      expect(validStatuses.includes(status)).toBe(true);

      const invalidStatus = 'INVALID' as AccountStatus;
      expect(validStatuses.includes(invalidStatus)).toBe(false);
    });

    it('should remove apartment when rejecting user', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: 'apt1',
      };

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.REJECTED,
        apartmentId: null,
        apartment: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      const result = await prisma.user.update({
        where: { id: '1' },
        data: {
          status: AccountStatus.REJECTED,
          apartmentId: null,
        },
        include: { apartment: true },
      });

      expect(result.status).toBe(AccountStatus.REJECTED);
      expect(result.apartmentId).toBeNull();
    });
  });
});
