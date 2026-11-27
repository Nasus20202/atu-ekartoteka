import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { TenantVotingsList } from '@/components/votings/tenant-votings-list';

export default function TenantVotingsPage() {
  return (
    <Page>
      <PageHeader
        title="Głosowania"
        description="Głosowania właścicieli w Twoich wspólnotach"
      />
      <Suspense fallback={<CardListSkeleton cards={2} rows={2} />}>
        <TenantVotingsList />
      </Suspense>
    </Page>
  );
}
