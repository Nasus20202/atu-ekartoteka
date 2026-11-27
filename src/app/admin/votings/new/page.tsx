import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';
import { AdminVotingFormSection } from '@/components/votings/admin-voting-form-section';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { PAGE_TITLES } from '@/lib/shared/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.newVoting };

export default async function NewVotingPage() {
  await requireAdminAccess();

  return (
    <Page maxWidth="4xl">
      <PageHeader title="Nowe głosowanie" />
      <Suspense fallback={<FormCardSkeleton />}>
        <AdminVotingFormSection />
      </Suspense>
    </Page>
  );
}
