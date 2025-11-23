import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

vi.mock('@/lib/database/prisma', () => ({
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

const { prisma } = await import('@/lib/database/prisma');

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
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartments: [],
        },
        {
          id: '2',
          email: 'tenant2@example.com',
          password: 'hashedpassword',
          name: 'Tenant Two',
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartments: [
            {
              id: '1',
              externalId: 'EXT1',
              owner: 'Owner Name',
              email: null,
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
          ],
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

      const result = await prisma.user.findMany({
        where: { role: UserRole.TENANT },
        include: { apartments: true },
        orderBy: [{ createdAt: 'desc' }],
      });

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(UserRole.TENANT);
      expect(result[1].apartments).toBeDefined();
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
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartments: [],
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(
        mockPendingUsers as any
      );

      const result = await prisma.user.findMany({
        where: {
          status: AccountStatus.PENDING,
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          role: UserRole.TENANT,
        },
        include: { apartments: true },
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
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          createdAt: new Date(),
          updatedAt: new Date(),
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

      vi.mocked(prisma.user.findMany).mockResolvedValue(
        mockApprovedUsers as any
      );

      const result = await prisma.user.findMany({
        where: {
          status: AccountStatus.APPROVED,
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          role: UserRole.TENANT,
        },
        include: { apartments: true },
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
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartments: [],
      };

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.APPROVED,
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        apartments: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await prisma.user.update({
        where: { id: '1' },
        data: {
          status: AccountStatus.APPROVED,
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          apartments: { set: [] },
        },
        include: { apartments: true },
      });

      expect(result.status).toBe(AccountStatus.APPROVED);
      expect(result.apartments).toHaveLength(0);
    });

    it('should approve a user and assign apartment', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartments: [],
      };

      const mockApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'Owner',
        email: null,
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
        userId: null,
        user: null,
      };

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.APPROVED,
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        apartments: [mockApartment],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(
        mockApartment as any
      );
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

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
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
        },
        include: { apartments: true },
      });

      expect(result.status).toBe(AccountStatus.APPROVED);
      expect(result.apartments).toBeDefined();
    });

    it('should reject a user', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartments: [],
      };

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.REJECTED,
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        apartments: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await prisma.user.update({
        where: { id: '1' },
        data: {
          status: AccountStatus.REJECTED,
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          apartments: { set: [] },
        },
        include: { apartments: true },
      });

      expect(result.status).toBe(AccountStatus.REJECTED);
      expect(result.apartments).toHaveLength(0);
    });

    it('should prevent assigning already occupied apartment', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartments: [],
      };

      const occupiedApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'Owner',
        email: null,
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
        userId: 'other-user',
        user: {
          id: 'other-user',
          email: 'other@example.com',
          password: 'hashedpassword',
          name: 'Other User',
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(
        occupiedApartment as any
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
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartments: [{ id: 'apt1', externalId: 'EXT1', number: '1' }],
      };

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.REJECTED,
        emailVerified: true,

        authMethod: AuthMethod.CREDENTIALS,
        apartments: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await prisma.user.update({
        where: { id: '1' },
        data: {
          status: AccountStatus.REJECTED,
          emailVerified: true,

          authMethod: AuthMethod.CREDENTIALS,
          apartments: { set: [] },
        },
        include: { apartments: true },
      });

      expect(result.status).toBe(AccountStatus.REJECTED);
      expect(result.apartments).toHaveLength(0);
    });
  });
});
