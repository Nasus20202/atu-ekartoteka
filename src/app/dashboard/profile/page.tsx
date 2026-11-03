import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProfileContent } from '@/components/account/profile-content';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';
import { PAGE_TITLES } from '@/lib/metadata/document-title';

export const metadata: Metadata = { title: PAGE_TITLES.profile };

export default function ProfilePage() {
  return (
    <Page maxWidth="2xl">
      <PageHeader
        title="Profil"
        description="Zarządzaj swoimi danymi osobowymi"
      />
      <Suspense fallback={<FormCardSkeleton />}>
        <ProfileContent />
      </Suspense>
    </Page>
  );
}
