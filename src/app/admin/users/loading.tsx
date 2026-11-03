import { Page } from '@/components/layout/page';
import { UsersPageSkeleton } from '@/components/users/users-page-skeleton';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/list-view-mode';
import { getListViewMode } from '@/lib/list-view-mode-server';

export default async function UsersLoading() {
  const viewMode = await getListViewMode(LIST_VIEW_STORAGE_KEYS.users);

  return (
    <Page maxWidth="7xl">
      <UsersPageSkeleton mode={viewMode} />
    </Page>
  );
}
