import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsSection } from '@/components/settings/settings-section';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';

export default function SettingsPage() {
  return (
    <Page maxWidth="4xl">
      <PageHeader title="Ustawienia" showBackButton={false} />
      <Suspense fallback={<FormCardSkeleton />}>
        <SettingsSection />
      </Suspense>
    </Page>
  );
}
