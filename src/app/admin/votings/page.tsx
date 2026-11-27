import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { CardListSkeleton } from '@/components/skeletons/card-list-skeleton';
import { Button } from '@/components/ui/button';
import { AdminVotingsList } from '@/components/votings/admin-votings-list';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';

export default async function AdminVotingsPage() {
  await requireAdminAccess();

  return (
    <Page maxWidth="7xl">
      <PageHeader
        title="Głosowania"
        description="Głosowania właścicieli lokali w poszczególnych wspólnotach"
        showBackButton={false}
        action={
          <Button asChild>
            <Link href={`${VOTING_PATHS.admin}/new`}>
              <Plus />
              Nowe głosowanie
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<CardListSkeleton cards={3} rows={2} />}>
        <AdminVotingsList />
      </Suspense>
    </Page>
  );
}
