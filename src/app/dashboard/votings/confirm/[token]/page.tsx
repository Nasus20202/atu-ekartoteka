import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { VoteConfirmationView } from '@/components/votings/vote-confirmation-view';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ConfirmVotePage({ params }: Props) {
  const { token } = await params;

  return (
    <Page maxWidth="4xl">
      <PageHeader title="Potwierdź głos" />
      <Suspense fallback={<CardListSkeleton cards={1} rows={3} />}>
        <VoteConfirmationView token={token} />
      </Suspense>
    </Page>
  );
}
