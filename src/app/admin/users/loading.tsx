import { Page } from '@/components/layout/page';
import { UsersPageSkeleton } from '@/components/users/users-page-skeleton';

export default function UsersLoading() {
  return (
    <Page maxWidth="7xl">
      <UsersPageSkeleton />
    </Page>
  );
}
