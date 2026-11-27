import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { TenantVotingDetail } from '@/components/votings/tenant-voting-detail';

interface Props {
  params: Promise<{ votingId: string }>;
}

export default async function TenantVotingPage({ params }: Props) {
  const { votingId } = await params;

  return (
    <Page maxWidth="4xl">
      <PageHeader title="Głosowanie" />
      <Suspense fallback={<CardListSkeleton cards={2} rows={3} />}>
        <TenantVotingDetail votingId={votingId} />
      </Suspense>
    </Page>
  );
}
