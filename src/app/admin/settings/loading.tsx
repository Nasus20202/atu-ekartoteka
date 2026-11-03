import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';

export default function SettingsLoading() {
  return (
    <Page maxWidth="4xl">
      <PageHeader title="Ustawienia" showBackButton={false} />
      <FormCardSkeleton />
    </Page>
  );
}
