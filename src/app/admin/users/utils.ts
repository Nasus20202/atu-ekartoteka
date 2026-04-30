import type { Apartment, User } from '@/app/admin/users/types';
import type { UserFilter } from '@/app/admin/users/user-filters';
import { AccountStatus } from '@/lib/types';

export function buildUsersQuery(
  filter: UserFilter,
  page: number,
  search: string
): string {
  const params = new URLSearchParams();

  if (filter === 'ADMINS') {
    params.append('role', 'ADMIN');
  } else if (filter !== 'ALL') {
    params.append('status', filter);
  }

  params.append('page', String(page));

  if (search) {
    params.append('search', search);
  }

  return params.toString();
}

export function getAvailableApartments(
  apartments: Apartment[],
  allUsers: User[],
  selectedUser: User | null
): Apartment[] {
  if (selectedUser?.status === AccountStatus.PENDING) {
    return apartments.filter(
      (apt) =>
        !allUsers.some((user) => user.apartments?.some((a) => a.id === apt.id))
    );
  }

  const currentUserApartmentIds =
    selectedUser?.apartments?.map((apt) => apt.id) || [];

  return apartments.filter(
    (apt) =>
      currentUserApartmentIds.includes(apt.id) ||
      !allUsers.some(
        (user) =>
          user.id !== selectedUser?.id &&
          user.apartments?.some((apartment) => apartment.id === apt.id)
      )
  );
}

export function isApartmentMatchingUser(
  apartment: Apartment,
  user: User | null
): boolean {
  if (!user) {
    return false;
  }

  const userName = user.name?.toLowerCase() || '';
  const userEmail = user.email?.toLowerCase() || '';
  const apartmentOwner = apartment.owner?.toLowerCase() || '';
  const apartmentEmail = apartment.email?.toLowerCase() || '';

  return (
    (userName !== '' &&
      apartmentOwner !== '' &&
      apartmentOwner.includes(userName)) ||
    (userName !== '' &&
      apartmentOwner !== '' &&
      userName.includes(apartmentOwner)) ||
    (userEmail !== '' && apartmentEmail !== '' && userEmail === apartmentEmail)
  );
}

export function filterAndSortApartments(
  apartments: Apartment[],
  apartmentSearch: string,
  selectedApartmentIds: string[],
  selectedUser: User | null
): Apartment[] {
  return apartments
    .filter((apt) => {
      if (apartmentSearch === '') {
        return true;
      }

      const search = apartmentSearch.toLowerCase();
      const fullTitle =
        `${apt.address || ''} ${apt.building || ''}/${apt.number || ''}`.toLowerCase();

      return (
        apt.number?.toLowerCase().includes(search) ||
        apt.address?.toLowerCase().includes(search) ||
        apt.building?.toLowerCase().includes(search) ||
        apt.owner?.toLowerCase().includes(search) ||
        apt.email?.toLowerCase().includes(search) ||
        apt.externalOwnerId?.toLowerCase().includes(search) ||
        apt.externalApartmentId?.toLowerCase().includes(search) ||
        fullTitle.includes(search)
      );
    })
    .sort((left, right) => {
      const leftSelected = selectedApartmentIds.includes(left.id);
      const rightSelected = selectedApartmentIds.includes(right.id);

      if (leftSelected && !rightSelected) {
        return -1;
      }

      if (!leftSelected && rightSelected) {
        return 1;
      }

      const leftMatches = isApartmentMatchingUser(left, selectedUser);
      const rightMatches = isApartmentMatchingUser(right, selectedUser);

      if (leftMatches && !rightMatches) {
        return -1;
      }

      if (!leftMatches && rightMatches) {
        return 1;
      }

      const buildingCompare = (left.building || '').localeCompare(
        right.building || '',
        undefined,
        { numeric: true, sensitivity: 'base' }
      );

      if (buildingCompare !== 0) {
        return buildingCompare;
      }

      return (left.number || '').localeCompare(right.number || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
}

export function getPendingDescription(
  pendingCount: number
): string | undefined {
  if (pendingCount <= 0) {
    return undefined;
  }

  if (pendingCount === 1) {
    return '1 konto oczekuje na zatwierdzenie';
  }

  if (pendingCount < 5) {
    return `${pendingCount} konta oczekują na zatwierdzenie`;
  }

  return `${pendingCount} kont oczekuje na zatwierdzenie`;
}

export function getApartmentSharePercent(apartment: Apartment): string | null {
  if (
    apartment.shareNumerator == null ||
    apartment.shareDenominator == null ||
    apartment.shareDenominator <= 0
  ) {
    return null;
  }

  return `${((apartment.shareNumerator / apartment.shareDenominator) * 100).toFixed(1)}%`;
}
