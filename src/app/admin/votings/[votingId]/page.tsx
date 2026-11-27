import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { AdminVotingDetail } from '@/components/votings/admin-voting-detail';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';

interface Props {
  params: Promise<{ votingId: string }>;
}

export default async function AdminVotingPage({ params }: Props) {
  await requireAdminAccess();
  const { votingId } = await params;

  return (
    <Page maxWidth="6xl">
      <PageHeader title="Głosowanie" />
      <Suspense fallback={<CardListSkeleton cards={2} rows={3} />}>
        <AdminVotingDetail votingId={votingId} />
      </Suspense>
    </Page>
  );
}
