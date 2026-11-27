import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';
import { AdminVotingFormSection } from '@/components/votings/admin-voting-form-section';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { PAGE_TITLES } from '@/lib/shared/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.editVoting };

interface Props {
  params: Promise<{ votingId: string }>;
}

export default async function EditVotingPage({ params }: Props) {
  await requireAdminAccess();
  const { votingId } = await params;

  return (
    <Page maxWidth="4xl">
      <PageHeader title="Edycja głosowania" />
      <Suspense fallback={<FormCardSkeleton />}>
        <AdminVotingFormSection votingId={votingId} />
      </Suspense>
    </Page>
  );
}
