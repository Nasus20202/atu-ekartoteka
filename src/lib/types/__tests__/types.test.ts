import { describe, expect, it } from 'vitest';

import {
  AccountStatus,
  type Apartment,
  type ApartmentWithUser,
  type User,
  UserRole,
  type UserWithApartment,
} from '@/lib/types';

describe('Type definitions', () => {
  describe('User type', () => {
    it('should accept valid User object', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.TENANT);
    });

    it('should allow null values for optional fields', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
        name: null,
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      expect(user.name).toBeNull();
      expect(user.apartmentId).toBeNull();
    });
  });

  describe('UserWithApartment type', () => {
    it('should accept User with apartment', () => {
      const userWithApt: UserWithApartment = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: 'apt-1',
        apartment: {
          id: 'apt-1',
          homeownersAssociationId: 'hoa-1',
          externalId: 'EXT123',
          owner: 'Owner Name',
          address: 'Test St',
          building: '1',
          number: '10',
          postalCode: '00-000',
          city: 'Warsaw',
          area: 50.5,
          height: 2.5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(userWithApt.apartment).toBeDefined();
      expect(userWithApt.apartment?.externalId).toBe('EXT123');
    });

    it('should accept User without apartment (null)', () => {
      const userWithoutApt: UserWithApartment = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
        apartment: null,
      };

      expect(userWithoutApt.apartment).toBeNull();
    });
  });

  describe('Apartment type', () => {
    it('should accept valid Apartment object', () => {
      const apartment: Apartment = {
        id: 'apt-1',
        homeownersAssociationId: 'hoa-1',
        externalId: 'EXT123',
        owner: 'Owner Name',
        address: 'Test Street 1',
        building: 'A',
        number: '10',
        postalCode: '00-000',
        city: 'Warsaw',
        area: 75.5,
        height: 2.8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(apartment.externalId).toBe('EXT123');
      expect(apartment.area).toBe(75.5);
      expect(apartment.isActive).toBe(true);
    });

    it('should accept inactive apartment', () => {
      const apartment: Apartment = {
        id: 'apt-2',
        homeownersAssociationId: 'hoa-1',
        externalId: 'EXT456',
        owner: 'Another Owner',
        address: 'Different St',
        building: 'B',
        number: '5',
        postalCode: '11-111',
        city: 'Krakow',
        area: 60.0,
        height: 2.6,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(apartment.isActive).toBe(false);
    });
  });

  describe('ApartmentWithUser type', () => {
    it('should accept Apartment with user', () => {
      const aptWithUser: ApartmentWithUser = {
        id: 'apt-1',
        homeownersAssociationId: 'hoa-1',
        externalId: 'EXT123',
        owner: 'Owner Name',
        address: 'Test St',
        building: '1',
        number: '10',
        postalCode: '00-000',
        city: 'Warsaw',
        area: 50.5,
        height: 2.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          email: 'tenant@example.com',
          name: 'Tenant Name',
          role: UserRole.TENANT,
          status: AccountStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date(),
          apartmentId: 'apt-1',
        },
      };

      expect(aptWithUser.user).toBeDefined();
      expect(aptWithUser.user?.email).toBe('tenant@example.com');
    });

    it('should accept Apartment without user (null)', () => {
      const aptWithoutUser: ApartmentWithUser = {
        id: 'apt-1',
        homeownersAssociationId: 'hoa-1',
        externalId: 'EXT123',
        owner: 'Owner Name',
        address: 'Test St',
        building: '1',
        number: '10',
        postalCode: '00-000',
        city: 'Warsaw',
        area: 50.5,
        height: 2.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
      };

      expect(aptWithoutUser.user).toBeNull();
    });
  });

  describe('Type compatibility', () => {
    it('should ensure UserRole is compatible across types', () => {
      const admin: User = {
        id: '1',
        email: 'admin@example.com',
        password: 'hashed',
        name: 'Admin',
        role: UserRole.ADMIN,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      const tenant: UserWithApartment = {
        id: '2',
        email: 'tenant@example.com',
        password: 'hashed',
        name: 'Tenant',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
        apartment: null,
      };

      expect(admin.role).toBe('ADMIN');
      expect(tenant.role).toBe('TENANT');
    });

    it('should ensure AccountStatus is compatible across types', () => {
      const pendingUser: User = {
        id: '1',
        email: 'pending@example.com',
        password: 'hashed',
        name: 'Pending User',
        role: UserRole.TENANT,
        status: AccountStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      const approvedUser: UserWithApartment = {
        id: '2',
        email: 'approved@example.com',
        password: 'hashed',
        name: 'Approved User',
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
        apartment: null,
      };

      const rejectedUser: User = {
        id: '3',
        email: 'rejected@example.com',
        password: 'hashed',
        name: 'Rejected User',
        role: UserRole.TENANT,
        status: AccountStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
        apartmentId: null,
      };

      expect(pendingUser.status).toBe('PENDING');
      expect(approvedUser.status).toBe('APPROVED');
      expect(rejectedUser.status).toBe('REJECTED');
    });
  });
});
