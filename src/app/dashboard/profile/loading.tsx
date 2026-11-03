import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';

export default function ProfileLoading() {
  return (
    <Page maxWidth="2xl">
      <PageHeader
        title="Profil"
        description="Zarządzaj swoimi danymi osobowymi"
      />
      <FormCardSkeleton />
    </Page>
  );
}
