import { toTenantVotingDto } from '@/lib/voting/dto/tenant-voting-dto';
import { findTenantVotings } from '@/lib/voting/queries/find-tenant-votings';
import { VotingStatus } from '@/lib/voting/types/voting';

/** Open votings in which at least one of the user's apartments has not voted. */
export async function countAwaitingVotings(
  userId: string,
  now: Date
): Promise<number> {
  const votings = await findTenantVotings(userId, [VotingStatus.ACTIVE]);

  return votings.reduce(
    (count, voting) =>
      count + (toTenantVotingDto(voting, now).awaitingVote ? 1 : 0),
    0
  );
}
