import { AccountStatus, UserRole } from '@/lib/types';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export interface UsersQuery {
  role: UserRole;
  status: AccountStatus | null;
  page: number;
  limit: number;
  search: string | null;
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
    role !== UserRole.ADMIN &&
    statusParam &&
    !Object.values(AccountStatus).includes(statusParam as AccountStatus)
  ) {
    return { error: 'Nieprawidłowy status' };
  }

  return {
    query: {
      role,
      status:
        role === UserRole.ADMIN ? null : (statusParam as AccountStatus | null),
      page: parsePositiveInteger(searchParams.get('page'), 1),
      limit: Math.min(
        MAX_PAGE_SIZE,
        parsePositiveInteger(searchParams.get('limit'), DEFAULT_PAGE_SIZE)
      ),
      search: searchParams.get('search')?.trim() || null,
    },
  };
}
