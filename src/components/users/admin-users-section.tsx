import { loadUsersPage } from '@/app/api/admin/users/load-users-page';
import { parseUsersQuery } from '@/app/api/admin/users/users-query';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { AdminUsersContent } from '@/components/users/admin-users-content';
import { buildUsersQuery } from '@/components/users/utils';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/list-view-mode';
import { getListViewMode } from '@/lib/list-view-mode-server';
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

  const [{ users, pagination }, viewMode] = await Promise.all([
    loadUsersPage(parsed.query),
    getListViewMode(LIST_VIEW_STORAGE_KEYS.users),
  ]);

  return (
    <div className={REVEAL_CLASS}>
      <AdminUsersContent
        initialPage={{ items: users, ...pagination }}
        initialViewMode={viewMode}
      />
    </div>
  );
}
