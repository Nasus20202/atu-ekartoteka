import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { AdminUsersSection } from '@/components/users/admin-users-section';
import { UsersPageSkeleton } from '@/components/users/users-page-skeleton';

export default function AdminUsersPage() {
  return (
    <Page maxWidth="7xl">
      <Suspense fallback={<UsersPageSkeleton />}>
        <AdminUsersSection />
      </Suspense>
    </Page>
  );
}
