import type { UserFilter } from '@/app/admin/users/user-filters';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';
import type { SortState, UserSortKey } from '@/lib/utils/sort';

export function buildUsersQuery(
  filter: UserFilter,
  page: number,
  search: string,
  sort: SortState<UserSortKey> | null = null
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

  if (sort) {
    params.append('sort', sort.key);
    params.append('order', sort.direction);
  }

  return params.toString();
}

export function isApartmentMatchingUser(
  apartment: ApartmentSummaryDto,
  user: UserDto | null
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

/** Keeps the database order, moving selected, then user-matching apartments to the top. */
export function pinSelectedAndMatching(
  apartments: ApartmentSummaryDto[],
  selectedApartmentIds: string[],
  selectedUser: UserDto | null
): ApartmentSummaryDto[] {
  const selected = new Set(selectedApartmentIds);
  const rank = (apartment: ApartmentSummaryDto) =>
    selected.has(apartment.id)
      ? 0
      : isApartmentMatchingUser(apartment, selectedUser)
        ? 1
        : 2;

  return [0, 1, 2].flatMap((group) =>
    apartments.filter((apartment) => rank(apartment) === group)
  );
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
