import { REVEAL_CLASS } from '@/components/layout/reveal';
import { AdminVotingsBrowser } from '@/components/votings/admin-votings-browser';
import type { ListViewMode } from '@/hooks/use-list-view-mode';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { findHoas } from '@/lib/hoa/queries/find-hoas';
import { toVotingListItemDto } from '@/lib/voting/dto/voting-dto';
import { findAdminVotings } from '@/lib/voting/queries/find-admin-votings';
import {
  toVotingListQuery,
  type VotingListSearchParams,
} from '@/lib/voting/rules/voting-list-query';

interface Props {
  searchParams: Promise<VotingListSearchParams>;
  viewMode: ListViewMode;
}

export async function AdminVotingsList({ searchParams, viewMode }: Props) {
  await requireAdminAccess();

  const query = toVotingListQuery(await searchParams);
  const [votings, hoas] = await Promise.all([
    findAdminVotings(query),
    findHoas(''),
  ]);

  return (
    <div className={REVEAL_CLASS}>
      <AdminVotingsBrowser
        votings={votings.map(toVotingListItemDto)}
        query={query}
        hoas={hoas.map(({ id, name }) => ({ id, name }))}
        initialViewMode={viewMode}
      />
    </div>
  );
}
