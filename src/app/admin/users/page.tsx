import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { AdminUsersSection } from '@/components/users/admin-users-section';
import { UsersPageSkeleton } from '@/components/users/users-page-skeleton';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { getListViewMode } from '@/lib/framework/list-view-mode-server';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/shared/list-view-mode';

export default async function AdminUsersPage() {
  await requireAdminAccess();
  const viewMode = await getListViewMode(LIST_VIEW_STORAGE_KEYS.users);

  return (
    <Page maxWidth="7xl">
      <Suspense fallback={<UsersPageSkeleton mode={viewMode} />}>
        <AdminUsersSection />
      </Suspense>
    </Page>
  );
}
