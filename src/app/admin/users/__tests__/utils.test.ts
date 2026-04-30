import { describe, expect, it } from 'vitest';

import { createEmptyNewUserData } from '@/app/admin/users/constants';
import type { Apartment, User } from '@/app/admin/users/types';
import {
  buildUsersQuery,
  filterAndSortApartments,
  getApartmentSharePercent,
  getAvailableApartments,
  getPendingDescription,
  isApartmentMatchingUser,
} from '@/app/admin/users/utils';
import { AccountStatus, UserRole } from '@/lib/types';

const apartmentA: Apartment = {
  id: 'apt-a',
  externalOwnerId: 'owner-a',
  externalApartmentId: 'ext-a',
  owner: 'Jan Kowalski',
  email: 'jan@example.com',
  address: 'Lipowa',
  building: '10',
  number: '2',
  postalCode: '00-001',
  city: 'Warszawa',
  shareNumerator: 1,
  shareDenominator: 2,
  isActive: true,
};

const apartmentB: Apartment = {
  ...apartmentA,
  id: 'apt-b',
  externalOwnerId: 'owner-b',
  externalApartmentId: 'ext-b',
  owner: 'Anna Nowak',
  email: 'anna@example.com',
  building: '2',
  number: '10',
};

const apartmentC: Apartment = {
  ...apartmentA,
  id: 'apt-c',
  externalOwnerId: 'owner-c',
  externalApartmentId: 'ext-c',
  owner: 'Kowalski',
  email: 'other@example.com',
  building: '2',
  number: '1',
  shareNumerator: null,
  shareDenominator: null,
};

const approvedUser: User = {
  id: 'user-1',
  email: 'jan@example.com',
  name: 'Jan Kowalski',
  role: UserRole.TENANT,
  status: AccountStatus.APPROVED,
  emailVerified: true,
  mustChangePassword: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  apartments: [apartmentB],
};

describe('admin users utils', () => {
  it('builds users query for admin filter with search', () => {
    expect(buildUsersQuery('ADMINS', 2, 'anna')).toBe(
      'role=ADMIN&page=2&search=anna'
    );
  });

  it('builds users query for pending filter without search', () => {
    expect(buildUsersQuery(AccountStatus.PENDING, 1, '')).toBe(
      'status=PENDING&page=1'
    );
  });

  it('returns only unassigned apartments for pending user', () => {
    const pendingUser = { ...approvedUser, status: AccountStatus.PENDING };
    const otherUser = { ...approvedUser, apartments: [apartmentA] };

    expect(
      getAvailableApartments([apartmentA, apartmentB], [otherUser], pendingUser)
    ).toEqual([apartmentB]);
  });

  it('keeps selected user apartments and excludes other assigned ones', () => {
    const otherUser = {
      ...approvedUser,
      id: 'user-2',
      apartments: [apartmentA],
    };

    expect(
      getAvailableApartments(
        [apartmentA, apartmentB, apartmentC],
        [otherUser],
        approvedUser
      )
    ).toEqual([apartmentB, apartmentC]);
  });

  it('matches apartment by owner substring and email equality', () => {
    expect(isApartmentMatchingUser(apartmentA, approvedUser)).toBe(true);
    expect(isApartmentMatchingUser(apartmentC, approvedUser)).toBe(true);
    expect(isApartmentMatchingUser(apartmentB, null)).toBe(false);
  });

  it('filters by search and sorts selected, matching, then natural order', () => {
    const result = filterAndSortApartments(
      [apartmentA, apartmentB, apartmentC],
      'lipowa',
      ['apt-b'],
      approvedUser
    );

    expect(result.map((apartment) => apartment.id)).toEqual([
      'apt-b',
      'apt-c',
      'apt-a',
    ]);
  });

  it('returns pending description in all pluralization variants', () => {
    expect(getPendingDescription(0)).toBeUndefined();
    expect(getPendingDescription(1)).toBe('1 konto oczekuje na zatwierdzenie');
    expect(getPendingDescription(3)).toBe('3 konta oczekują na zatwierdzenie');
    expect(getPendingDescription(5)).toBe('5 kont oczekuje na zatwierdzenie');
  });

  it('formats apartment share percent only for valid denominators', () => {
    expect(getApartmentSharePercent(apartmentA)).toBe('50.0%');
    expect(getApartmentSharePercent(apartmentC)).toBeNull();
    expect(
      getApartmentSharePercent({
        ...apartmentA,
        shareNumerator: 1,
        shareDenominator: 0,
      })
    ).toBeNull();
  });

  it('creates empty new user form data with expected defaults', () => {
    expect(createEmptyNewUserData()).toEqual({
      email: '',
      password: '',
      name: '',
      role: UserRole.TENANT,
      status: AccountStatus.PENDING,
    });
  });
});
