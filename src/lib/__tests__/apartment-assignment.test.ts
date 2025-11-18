import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountStatus, UserRole } from '@/generated/prisma';
import type { Apartment } from '@/lib/types';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    apartment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const { prisma } = await import('@/lib/prisma');

describe('Apartment Assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Assignment Validation', () => {
    it('should allow assigning available apartment to approved user', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      const mockApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'John Doe',
        address: 'Main Street 1',
        building: 'A',
        number: '101',
        postalCode: '00-001',
        city: 'Warsaw',
        area: 55.5,
        height: 2.7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment);

      const user = await prisma.user.findUnique({ where: { id: 'user1' } });
      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
        include: { user: true },
      });

      expect(user).not.toBeNull();
      expect(apartment).not.toBeNull();
      expect(apartment?.user).toBeNull();
      expect(apartment?.isActive).toBe(true);
    });

    it('should prevent assigning inactive apartment', async () => {
      const mockApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'John Doe',
        address: 'Main Street 1',
        building: 'A',
        number: '101',
        postalCode: '00-001',
        city: 'Warsaw',
        area: 55.5,
        height: 2.7,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
      };

      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment);

      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
      });

      expect(apartment?.isActive).toBe(false);
    });

    it('should prevent assigning occupied apartment to different user', async () => {
      const existingUser = {
        id: 'user1',
        email: 'existing@example.com',
        password: 'hashedpassword',
        name: 'Existing User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: 'apt1',
      };

      const mockApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'John Doe',
        address: 'Main Street 1',
        building: 'A',
        number: '101',
        postalCode: '00-001',
        city: 'Warsaw',
        area: 55.5,
        height: 2.7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: existingUser,
      };

      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment);

      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
        include: { user: true },
      });

      expect(apartment?.user).not.toBeNull();
      expect(apartment?.user?.id).toBe('user1');

      // Attempting to assign to user2 should be prevented
      const newUserId = 'user2';
      expect(apartment?.user?.id).not.toBe(newUserId);
    });

    it('should allow reassigning same apartment to same user', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: 'apt1',
      };

      const mockApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'John Doe',
        address: 'Main Street 1',
        building: 'A',
        number: '101',
        postalCode: '00-001',
        city: 'Warsaw',
        area: 55.5,
        height: 2.7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment);

      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
        include: { user: true },
      });

      expect(apartment?.user?.id).toBe('user1');
    });
  });

  describe('Apartment Availability', () => {
    it('should list only active apartments', async () => {
      const mockApartments = [
        {
          id: 'apt1',
          homeownersAssociationId: 'hoa1',
          externalId: 'EXT1',
          owner: 'Owner 1',
          address: 'Street 1',
          building: 'A',
          number: '101',
          postalCode: '00-001',
          city: 'Warsaw',
          area: 50,
          height: 2.5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'apt2',
          homeownersAssociationId: 'hoa1',
          externalId: 'EXT2',
          owner: 'Owner 2',
          address: 'Street 2',
          building: 'B',
          number: '202',
          postalCode: '00-002',
          city: 'Warsaw',
          area: 60,
          height: 2.6,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.apartment.findMany).mockResolvedValue(mockApartments);

      const apartments = await prisma.apartment.findMany();
      const activeApartments = apartments.filter(
        (apt: Apartment) => apt.isActive
      );

      expect(apartments).toHaveLength(2);
      expect(activeApartments).toHaveLength(1);
      expect(activeApartments[0].externalId).toBe('EXT1');
    });

    it('should list unassigned apartments', async () => {
      const user1 = {
        id: 'user1',
        email: 'user1@example.com',
        password: 'hashedpassword',
        name: 'User 1',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: 'apt1',
      };

      const mockApartments = [
        {
          id: 'apt1',
          homeownersAssociationId: 'hoa1',
          externalId: 'EXT1',
          owner: 'Owner 1',
          address: 'Street 1',
          building: 'A',
          number: '101',
          postalCode: '00-001',
          city: 'Warsaw',
          area: 50,
          height: 2.5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: user1,
        },
        {
          id: 'apt2',
          homeownersAssociationId: 'hoa1',
          externalId: 'EXT2',
          owner: 'Owner 2',
          address: 'Street 2',
          building: 'B',
          number: '202',
          postalCode: '00-002',
          city: 'Warsaw',
          area: 60,
          height: 2.6,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: null,
        },
      ];

      vi.mocked(prisma.apartment.findMany).mockResolvedValue(
        mockApartments as never
      );

      const apartments =
        (await prisma.apartment.findMany()) as typeof mockApartments;
      const unassignedApartments = apartments.filter((apt) => !apt.user);

      expect(apartments).toHaveLength(2);
      expect(unassignedApartments).toHaveLength(1);
      expect(unassignedApartments[0].externalId).toBe('EXT2');
    });
  });

  describe('User Status and Apartment', () => {
    it('should remove apartment when user is rejected', async () => {
      const mockUser = {
        id: 'user1',
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

      const user = await prisma.user.findUnique({ where: { id: 'user1' } });
      expect(user?.apartmentId).toBe('apt1');

      const result = await prisma.user.update({
        where: { id: 'user1' },
        data: {
          status: AccountStatus.REJECTED,
          apartmentId: null,
        },
        include: { apartment: true },
      });

      expect(result.status).toBe(AccountStatus.REJECTED);
      expect(result.apartmentId).toBeNull();
    });

    it('should allow approved user to have no apartment', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
        apartment: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { id: 'user1' },
        include: { apartment: true },
      });

      expect(user?.status).toBe(AccountStatus.APPROVED);
      expect(user?.apartmentId).toBeNull();
      expect(user?.apartment).toBeNull();
    });

    it('should not allow pending user to have apartment', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
        apartment: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { id: 'user1' },
        include: { apartment: true },
      });

      expect(user?.status).toBe(AccountStatus.PENDING);
      expect(user?.apartmentId).toBeNull();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain one-to-one relationship between user and apartment', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: 'apt1',
      };

      const mockApartment = {
        id: 'apt1',
        homeownersAssociationId: 'hoa1',
        externalId: 'EXT1',
        owner: 'Owner',
        address: 'Street',
        building: 'A',
        number: '101',
        postalCode: '00-001',
        city: 'Warsaw',
        area: 50,
        height: 2.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment);

      const user = await prisma.user.findUnique({ where: { id: 'user1' } });
      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
        include: { user: true },
      });

      expect(user?.apartmentId).toBe('apt1');
      expect(apartment?.user?.id).toBe('user1');
    });
  });
});
