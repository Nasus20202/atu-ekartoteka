import { isAdminRole } from '@/lib/auth/admin-access';
import { AccountStatus, UserRole } from '@/lib/types';
import type { SortDirection, UserSortKey } from '@/lib/utils/sort';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const SORT_KEYS: readonly UserSortKey[] = [
  'name',
  'email',
  'status',
  'apartments',
];

export interface UsersQuery {
  role: UserRole;
  status: AccountStatus | null;
  page: number;
  limit: number;
  search: string | null;
  sort: UserSortKey | null;
  order: SortDirection;
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

/** Parses the user list query, or returns the Polish validation error. */
export function parseUsersQuery(
  searchParams: URLSearchParams
): { query: UsersQuery; error?: never } | { query?: never; error: string } {
  const roleParam = searchParams.get('role');
  if (
    roleParam &&
    roleParam !== UserRole.ADMIN &&
    roleParam !== UserRole.TENANT
  ) {
    return { error: 'Nieprawidłowa rola' };
  }

  const role = roleParam === UserRole.ADMIN ? UserRole.ADMIN : UserRole.TENANT;
  const statusParam = searchParams.get('status');

  if (
    !isAdminRole(role) &&
    statusParam &&
    !Object.values(AccountStatus).includes(statusParam as AccountStatus)
  ) {
    return { error: 'Nieprawidłowy status' };
  }

  const sortParam = searchParams.get('sort');
  if (sortParam && !SORT_KEYS.includes(sortParam as UserSortKey)) {
    return { error: 'Nieprawidłowe sortowanie' };
  }

  const orderParam = searchParams.get('order');
  if (orderParam && orderParam !== 'asc' && orderParam !== 'desc') {
    return { error: 'Nieprawidłowe sortowanie' };
  }

  return {
    query: {
      role,
      status: isAdminRole(role) ? null : (statusParam as AccountStatus | null),
      page: parsePositiveInteger(searchParams.get('page'), 1),
      limit: Math.min(
        MAX_PAGE_SIZE,
        parsePositiveInteger(searchParams.get('limit'), DEFAULT_PAGE_SIZE)
      ),
      search: searchParams.get('search')?.trim() || null,
      sort: (sortParam as UserSortKey | null) ?? null,
      order: orderParam === 'desc' ? 'desc' : 'asc',
    },
  };
}
