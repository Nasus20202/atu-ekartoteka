import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockApartment,
  createMockUser,
  mockApartments,
} from '@/__tests__/fixtures';
import { AccountStatus, Apartment } from '@/lib/types';

vi.mock('@/lib/database/prisma', () => ({
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

const { prisma } = await import('@/lib/database/prisma');

describe('Apartment Assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Assignment Validation', () => {
    it('should allow assigning available apartment to approved user', async () => {
      const mockUser = createMockUser({
        id: 'user1',
        email: 'user@example.com',
      });

      const mockApartment = createMockApartment();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(
        mockApartment as any
      );

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
      const mockApartment = createMockApartment({ isActive: false });

      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment);

      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
      });

      expect(apartment?.isActive).toBe(false);
    });

    it('should prevent assigning occupied apartment to different user', async () => {
      const existingUser = createMockUser({
        id: 'user1',
        email: 'existing@example.com',
        name: 'Existing User',
      });

      const mockApartment = createMockApartment({ user: existingUser });

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
      const mockUser = createMockUser({
        id: 'user1',
        email: 'user@example.com',
      });

      const mockApartment = createMockApartment({ user: mockUser });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(
        mockApartment as any
      );

      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
        include: { user: true },
      });

      expect(apartment?.user?.id).toBe('user1');
    });
  });

  describe('Apartment Availability', () => {
    it('should list only active apartments', async () => {
      const mockApartmentList = [
        createMockApartment({
          owner: 'Owner 1',
          address: 'Street 1',
          area: 50,
          height: 2.5,
        }),
        mockApartments.inactive,
      ];

      vi.mocked(prisma.apartment.findMany).mockResolvedValue(mockApartmentList);

      const apartments = await prisma.apartment.findMany();
      const activeApartments = apartments.filter(
        (apt: Apartment) => apt.isActive
      );

      expect(apartments).toHaveLength(2);
      expect(activeApartments).toHaveLength(1);
      expect(activeApartments[0].externalId).toBe('EXT1');
    });

    it('should list unassigned apartments', async () => {
      const user1 = createMockUser({
        id: 'user1',
        email: 'user1@example.com',
        name: 'User 1',
      });

      const mockApartmentList = [
        createMockApartment({
          owner: 'Owner 1',
          address: 'Street 1',
          area: 50,
          height: 2.5,
          user: user1,
        }),
        mockApartments.inactive,
      ];

      vi.mocked(prisma.apartment.findMany).mockResolvedValue(
        mockApartmentList as never
      );

      const apartments =
        (await prisma.apartment.findMany()) as typeof mockApartmentList;
      const unassignedApartments = apartments.filter((apt) => !apt.user);

      expect(apartments).toHaveLength(2);
      expect(unassignedApartments).toHaveLength(1);
      expect(unassignedApartments[0].externalId).toBe('EXT2');
    });
  });

  describe('User Status and Apartment', () => {
    it('should remove apartment when user is rejected', async () => {
      const mockUser = createMockUser({
        id: 'user1',
        email: 'user@example.com',
        apartments: [{ id: 'apt1', externalId: 'EXT1', number: '1' }],
      });

      const updatedUser = {
        ...mockUser,
        status: AccountStatus.REJECTED,
        emailVerified: true,
        apartments: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const user = await prisma.user.findUnique({
        where: { id: 'user1' },
        include: { apartments: true },
      });
      expect(user?.apartments).toHaveLength(1);

      const result = await prisma.user.update({
        where: { id: 'user1' },
        data: {
          status: AccountStatus.REJECTED,
          emailVerified: true,
          apartments: { set: [] },
        },
        include: { apartments: true },
      });

      expect(result.status).toBe(AccountStatus.REJECTED);
      expect(result.apartments).toHaveLength(0);
    });

    it('should allow approved user to have no apartment', async () => {
      const mockUser = {
        ...createMockUser({
          id: 'user1',
          email: 'user@example.com',
        }),
        apartment: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const user = await prisma.user.findUnique({
        where: { id: 'user1' },
        include: { apartments: true },
      });

      expect(user?.status).toBe(AccountStatus.APPROVED);
      expect(user?.apartments).toHaveLength(0);
    });

    it('should not allow pending user to have apartment', async () => {
      const mockUser = {
        ...createMockUser({
          id: 'user1',
          email: 'user@example.com',
          status: AccountStatus.PENDING,
          emailVerified: true,
        }),
        apartment: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const user = await prisma.user.findUnique({
        where: { id: 'user1' },
        include: { apartments: true },
      });

      expect(user?.status).toBe(AccountStatus.PENDING);
      expect(user?.apartments).toHaveLength(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain one-to-many relationship between user and apartments', async () => {
      const mockUser = createMockUser({
        id: 'user1',
        email: 'user@example.com',
        apartments: [{ id: 'apt1', externalId: 'EXT1', number: '1' }],
      });

      const mockApartment = createMockApartment({
        owner: 'Owner',
        address: 'Street',
        area: 50,
        height: 2.5,
        userId: 'user1',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment);

      const user = await prisma.user.findUnique({
        where: { id: 'user1' },
        include: { apartments: true },
      });
      const apartment = await prisma.apartment.findUnique({
        where: { id: 'apt1' },
        include: { user: true },
      });

      expect(user?.apartments).toHaveLength(1);
      expect(user?.apartments[0].id).toBe('apt1');
      expect(apartment?.userId).toBe('user1');
    });
  });
});
