import { describe, expect, it } from 'vitest';

import { createEmptyNewUserData } from '@/app/admin/users/constants';
import {
  buildUsersQuery,
  filterAndSortApartments,
  getApartmentSharePercent,
  getAvailableApartments,
  getPendingDescription,
  isApartmentMatchingUser,
} from '@/app/admin/users/utils';
import { AccountStatus, UserRole } from '@/lib/types';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';

const apartmentA: ApartmentSummaryDto = {
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

const apartmentB: ApartmentSummaryDto = {
  ...apartmentA,
  id: 'apt-b',
  externalOwnerId: 'owner-b',
  externalApartmentId: 'ext-b',
  owner: 'Anna Nowak',
  email: 'anna@example.com',
  building: '2',
  number: '10',
};

const apartmentC: ApartmentSummaryDto = {
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

const approvedUser: UserDto = {
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
    expect(getApartmentSharePercent(apartmentA)).toBe('50%');
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

  it('treats a missing selected user as having no apartments', () => {
    const otherUser = {
      ...approvedUser,
      id: 'user-2',
      apartments: [apartmentA],
    };

    expect(
      getAvailableApartments([apartmentA, apartmentB], [otherUser], null).map(
        (apartment) => apartment.id
      )
    ).toEqual(['apt-b']);
  });

  it('matches by email only when names are missing', () => {
    const userWithoutName = { ...approvedUser, name: null };
    const apartmentWithoutOwner = { ...apartmentA, owner: null };

    expect(
      isApartmentMatchingUser(apartmentWithoutOwner, userWithoutName)
    ).toBe(true);
    expect(
      isApartmentMatchingUser(
        { ...apartmentWithoutOwner, email: null },
        { ...userWithoutName, email: '' }
      )
    ).toBe(false);
  });

  it('matches when the user name contains the apartment owner', () => {
    expect(
      isApartmentMatchingUser(
        { ...apartmentA, owner: 'Kowalski', email: null },
        { ...approvedUser, email: '' }
      )
    ).toBe(true);
  });

  it.each([
    ['2', ['apt-a']],
    ['ext-', ['apt-b', 'apt-a']],
    ['nowak', ['apt-b']],
    ['anna@', ['apt-b']],
    ['owner-a', ['apt-a']],
    ['ext-b', ['apt-b']],
    ['lipowa 10/2', ['apt-a']],
  ])('searches apartments by %s', (search, expected) => {
    const result = filterAndSortApartments(
      [
        { ...apartmentA, address: 'Lipowa', building: '10', number: '2' },
        { ...apartmentB, address: null, building: null, number: '7' },
        {
          ...apartmentC,
          externalOwnerId: null,
          externalApartmentId: null,
          owner: null,
          email: null,
          address: null,
          building: null,
          number: null,
        } as unknown as ApartmentSummaryDto,
      ],
      search,
      [],
      null
    );

    expect(result.map((apartment) => apartment.id)).toEqual(expected);
  });

  it('sorts matching apartments first, then by building and number', () => {
    const user = { ...approvedUser, name: 'Zenon', email: 'zenon@example.com' };
    const result = filterAndSortApartments(
      [
        { ...apartmentA, id: 'no-building', building: null, number: null },
        { ...apartmentA, id: 'b1-n10', building: '1', number: '10' },
        { ...apartmentA, id: 'b1-n9', building: '1', number: '9' },
        {
          ...apartmentA,
          id: 'match',
          building: '9',
          owner: 'Zenon',
          email: null,
        },
      ] as unknown as ApartmentSummaryDto[],
      '',
      [],
      { ...user, apartments: [] }
    );

    expect(result.map((apartment) => apartment.id)).toEqual([
      'match',
      'no-building',
      'b1-n9',
      'b1-n10',
    ]);
  });

  it('builds an empty filter query for all users', () => {
    expect(buildUsersQuery('ALL', 1, '')).toBe('page=1');
  });

  it.each([
    ['first', ['match', 'other']],
    ['last', ['other', 'match']],
  ])('keeps a matching apartment first when it starts %s', (_, order) => {
    const apartments = {
      match: { ...apartmentA, id: 'match', owner: 'Zenon', email: null },
      other: { ...apartmentA, id: 'other', owner: 'Inny', email: null },
    };
    const result = filterAndSortApartments(
      order.map((id) => apartments[id as keyof typeof apartments]),
      '',
      [],
      { ...approvedUser, name: 'Zenon', email: '', apartments: [] }
    );

    expect(result[0].id).toBe('match');
  });

  it('sorts apartments without a number first in either order', () => {
    const withNumber = { ...apartmentA, id: 'with-number', number: '1' };
    const withoutNumber = {
      ...apartmentA,
      id: 'without-number',
      number: null,
    } as unknown as ApartmentSummaryDto;

    for (const input of [
      [withNumber, withoutNumber],
      [withoutNumber, withNumber],
    ]) {
      expect(
        filterAndSortApartments(input, '', [], null).map((a) => a.id)
      ).toEqual(['without-number', 'with-number']);
    }
  });
});
