import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';

export default function BulkCreateUsersLoading() {
  return (
    <Page maxWidth="4xl">
      <PageHeader
        title="Zarządzanie kontami"
        description="Twórz konta lub przypisuj istniejące do mieszkań"
        showBackButton={false}
      />
      <FormCardSkeleton />
    </Page>
  );
}
