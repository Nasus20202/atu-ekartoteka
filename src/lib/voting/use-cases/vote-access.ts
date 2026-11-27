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

/** Why a tenant may not vote: the account, the voting that is not visible, or the closed voting. */
export type AccessDenial = 'no-access' | 'not-found' | 'closed';

export const VOTING_ENDED = 'Głosowanie zostało zakończone';

/** The voting a tenant may vote in at `now`, or the reason they may not. */
export async function resolveOpenVoting(
  userId: string,
  votingId: unknown,
  now: Date
): Promise<
  { voting: OpenVoting } | { failure: UseCaseFailure; denial: AccessDenial }
> {
  if (typeof votingId !== 'string') {
    return {
      failure: notFoundResult('Nie znaleziono głosowania'),
      denial: 'not-found',
    };
  }

  const user = await findUserById(userId);
  if (!user || !isApprovedAccount(user)) {
    return {
      failure: invalidResult('Twoje konto nie ma dostępu do głosowań'),
      denial: 'no-access',
    };
  }

  const voting = await findTenantVoting(userId, votingId);
  if (!voting) {
    return {
      failure: notFoundResult('Nie znaleziono głosowania'),
      denial: 'not-found',
    };
  }

  if (!isVotingOpen(voting, now)) {
    return { failure: invalidResult(VOTING_ENDED), denial: 'closed' };
  }

  return { voting };
}
