'use server';

import {
  type ActionResult,
  fromUseCaseResult,
  readInput,
} from '@/actions/action-result';
import { requireUserAction } from '@/lib/framework/auth/require-action';
import { confirmVote } from '@/lib/voting/use-cases/confirm-vote';
import { requestVoteConfirmation } from '@/lib/voting/use-cases/request-vote-confirmation';

export async function requestVoteConfirmationAction(
  input: unknown
): Promise<ActionResult<{ expiresAt: string }>> {
  const { session, denied } = await requireUserAction();
  if (denied) return denied;

  const { votingId, answers } = readInput(input);

  return fromUseCaseResult(
    await requestVoteConfirmation(session.user.id, votingId, answers)
  );
}

export async function confirmVoteAction(
  input: unknown
): Promise<ActionResult<{ ballots: number }>> {
  const { session, denied } = await requireUserAction();
  if (denied) return denied;

  const { votingId, code } = readInput(input);

  return fromUseCaseResult(await confirmVote(session.user.id, votingId, code));
}
