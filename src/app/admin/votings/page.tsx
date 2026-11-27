import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { AdminVotingsList } from '@/components/votings/admin-votings-list';
import { AdminVotingsSkeleton } from '@/components/votings/admin-votings-skeleton';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { getListViewMode } from '@/lib/framework/list-view-mode-server';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/shared/list-view-mode';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import type { VotingListSearchParams } from '@/lib/voting/rules/voting-list-query';

interface Props {
  searchParams: Promise<VotingListSearchParams>;
}

export default async function AdminVotingsPage({ searchParams }: Props) {
  await requireAdminAccess();
  const viewMode = await getListViewMode(LIST_VIEW_STORAGE_KEYS.votings);

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
      <Suspense fallback={<AdminVotingsSkeleton mode={viewMode} />}>
        <AdminVotingsList searchParams={searchParams} viewMode={viewMode} />
      </Suspense>
    </Page>
  );
}
