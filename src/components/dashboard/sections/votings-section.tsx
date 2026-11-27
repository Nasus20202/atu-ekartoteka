import { loadAccountUser } from '@/app/dashboard/dashboard-loaders';
import { VotingsCard } from '@/components/dashboard/votings-card';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { isApprovedAccount } from '@/lib/auth/rules/account-access';
import { getRequestNow } from '@/lib/framework/request-now';
import { toTenantVotingDto } from '@/lib/voting/dto/tenant-voting-dto';
import { findTenantVotings } from '@/lib/voting/queries/find-tenant-votings';

export async function VotingsSection() {
  const account = await loadAccountUser();

  if (!account || !isApprovedAccount(account)) {
    return null;
  }

  const now = await getRequestNow();
  const votings = (await findTenantVotings(account.id)).map((voting) =>
    toTenantVotingDto(voting, now)
  );

  if (votings.length === 0) {
    return null;
  }

  return (
    <div className={REVEAL_CLASS}>
      <VotingsCard votings={votings} />
    </div>
  );
}
