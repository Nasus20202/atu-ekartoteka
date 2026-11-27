import { isApprovedAccount } from '@/lib/auth/rules/account-access';
import {
  invalidResult,
  notFoundResult,
  type UseCaseFailure,
} from '@/lib/shared/use-case-result';
import { findUserById } from '@/lib/users/queries/find-user-by-id';
import { findTenantVoting } from '@/lib/voting/queries/find-tenant-votings';
import { isVotingOpen } from '@/lib/voting/rules/voting-status';

export type OpenVoting = NonNullable<
  Awaited<ReturnType<typeof findTenantVoting>>
>;

export const VOTING_ENDED = 'Głosowanie zostało zakończone';

/** The voting a tenant may vote in right now, or the reason they may not. */
export async function resolveOpenVoting(
  userId: string,
  votingId: unknown
): Promise<{ voting: OpenVoting } | { failure: UseCaseFailure }> {
  if (typeof votingId !== 'string') {
    return { failure: notFoundResult('Nie znaleziono głosowania') };
  }

  const user = await findUserById(userId);
  if (!user || !isApprovedAccount(user)) {
    return { failure: invalidResult('Twoje konto nie ma dostępu do głosowań') };
  }

  const voting = await findTenantVoting(userId, votingId);
  if (!voting) {
    return { failure: notFoundResult('Nie znaleziono głosowania') };
  }

  if (!isVotingOpen(voting, new Date())) {
    return { failure: invalidResult(VOTING_ENDED) };
  }

  return { voting };
}
