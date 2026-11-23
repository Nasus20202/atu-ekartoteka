import { loadUsersPage } from '@/app/api/admin/users/load-users-page';
import { parseUsersQuery } from '@/app/api/admin/users/users-query';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { SwrScope } from '@/components/providers/swr-scope';
import { AdminUsersContent } from '@/components/users/admin-users-content';
import { buildUsersQuery } from '@/components/users/utils';
import { AccountStatus } from '@/lib/auth/types/account';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { getListViewMode } from '@/lib/framework/list-view-mode-server';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/shared/list-view-mode';

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
      <SwrScope>
        <AdminUsersContent
          initialPage={{ items: users, ...pagination }}
          initialViewMode={viewMode}
        />
      </SwrScope>
    </div>
  );
}
