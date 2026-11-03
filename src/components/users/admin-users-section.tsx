import { loadUsersPage } from '@/app/api/admin/users/load-users-page';
import { parseUsersQuery } from '@/app/api/admin/users/users-query';
import { AdminUsersContent } from '@/components/users/admin-users-content';
import { buildUsersQuery } from '@/components/users/utils';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import { AccountStatus } from '@/lib/types';

const FIRST_PAGE = 1;

/** The pending users, which is the filter the page opens with. */
export async function AdminUsersSection() {
  await requireAdminAccess();

  const parsed = parseUsersQuery(
    new URLSearchParams(buildUsersQuery(AccountStatus.PENDING, FIRST_PAGE, ''))
  );
  if (parsed.error !== undefined) {
    throw new Error(parsed.error);
  }

  const { users, pagination } = await loadUsersPage(parsed.query);

  return <AdminUsersContent initialPage={{ items: users, ...pagination }} />;
}
