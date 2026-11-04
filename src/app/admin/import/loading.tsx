import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { FormCardSkeleton } from '@/components/skeletons/form-card-skeleton';

export default function AdminImportLoading() {
  return (
    <Page maxWidth="4xl">
      <PageHeader title="Import danych" showBackButton={false} />
      <FormCardSkeleton />
    </Page>
  );
}
