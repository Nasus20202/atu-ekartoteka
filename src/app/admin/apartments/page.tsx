import { Suspense } from 'react';

import { HoaListSection } from '@/components/apartments/hoa-list-section';
import { HoaListSkeleton } from '@/components/apartments/hoa-list-skeleton';
import { HoaNoticesButton } from '@/components/apartments/hoa-notices-button';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';

export default async function ApartmentsPage() {
  await requireAdminAccess();

  return (
    <Page maxWidth="7xl">
      <PageHeader
        title="Wspólnoty mieszkaniowe"
        description="Wybierz wspólnotę, aby zobaczyć mieszkania"
        showBackButton={false}
        action={<HoaNoticesButton />}
      />
      <Suspense fallback={<HoaListSkeleton />}>
        <HoaListSection />
      </Suspense>
    </Page>
  );
}
