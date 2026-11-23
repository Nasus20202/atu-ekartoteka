import type { UsersQuery } from '@/app/api/admin/users/users-query';
import { toUserDto } from '@/lib/users/dto/user-dto';
import { findTenantUsers } from '@/lib/users/queries/find-tenant-users';

/** One page of users as DTOs, shared by the API route and server pages. */
export async function loadUsersPage(query: UsersQuery) {
  const { role, status, page, limit, search, sort, order } = query;

  const { users, total } = await findTenantUsers(
    status,
    page,
    limit,
    search,
    role,
    sort ?? undefined,
    order
  );

  return {
    users: users.map(toUserDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
