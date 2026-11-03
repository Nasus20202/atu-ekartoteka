import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { AdminUsersSection } from '@/components/users/admin-users-section';
import { UsersPageSkeleton } from '@/components/users/users-page-skeleton';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/list-view-mode';
import { getListViewMode } from '@/lib/list-view-mode-server';

export default async function AdminUsersPage() {
  const viewMode = await getListViewMode(LIST_VIEW_STORAGE_KEYS.users);

  return (
    <Page maxWidth="7xl">
      <Suspense fallback={<UsersPageSkeleton mode={viewMode} />}>
        <AdminUsersSection />
      </Suspense>
    </Page>
  );
}
