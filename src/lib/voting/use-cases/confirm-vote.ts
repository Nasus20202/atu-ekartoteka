import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { castBallots } from '@/lib/voting/mutations/cast-ballots';
import { deleteVoteConfirmation } from '@/lib/voting/mutations/delete-vote-confirmation';
import { findVoteConfirmationByToken } from '@/lib/voting/queries/find-vote-confirmation';
import {
  hashConfirmationToken,
  isConfirmationTokenFormat,
} from '@/lib/voting/rules/confirmation-token';
import { parseAnswers } from '@/lib/voting/rules/voting-input';
import {
  resolveOpenVoting,
  VOTING_ENDED,
} from '@/lib/voting/use-cases/vote-access';

const logger = createLogger('voting:confirm');

export const LINK_INVALID =
  'Link jest nieprawidłowy, wygasł lub został już użyty. Poproś o nowy';

const ALL_VOTED = 'Oddano już głosy za wszystkie Twoje lokale';

const CAST_FAILURES = {
  closed: VOTING_ENDED,
  consumed: LINK_INVALID,
  'nothing-to-vote': ALL_VOTED,
  duplicate: ALL_VOTED,
} as const;

/** Redeems the emailed link of the signed-in user and stores the ballots. */
export async function confirmVote(
  userId: string,
  token: unknown
): Promise<UseCaseResult<{ ballots: number; votingId: string }>> {
  if (!isConfirmationTokenFormat(token)) return invalidResult(LINK_INVALID);

  const pending = await findVoteConfirmationByToken(
    hashConfirmationToken(token)
  );

  // A link opened by anyone but its owner looks the same as an unknown one
  if (!pending || pending.userId !== userId) {
    if (pending) {
      logger.warn({ userId, ownerId: pending.userId }, 'Foreign vote link');
    }
    return invalidResult(LINK_INVALID);
  }

  if (pending.expiresAt.getTime() <= Date.now()) {
    await deleteVoteConfirmation(pending.id);
    return invalidResult(LINK_INVALID);
  }

  const access = await resolveOpenVoting(userId, pending.votingId);
  if ('failure' in access) return access.failure;
  const { voting } = access;

  const answers = parseAnswers(
    pending.answers,
    voting.questions.map((question) => question.id)
  );
  if (!answers.ok) {
    await deleteVoteConfirmation(pending.id);
    return invalidResult(LINK_INVALID);
  }

  const result = await castBallots({
    confirmationId: pending.id,
    votingId: voting.id,
    hoaId: voting.hoa.id,
    userId,
    answers: answers.value,
    now: new Date(),
  });

  if (!result.ok) {
    return result.reason === 'duplicate'
      ? failedResult(CAST_FAILURES.duplicate)
      : invalidResult(CAST_FAILURES[result.reason]);
  }

  logger.info(
    { userId, votingId: voting.id, ballots: result.ballots },
    'Vote cast'
  );

  return { ok: true, data: { ballots: result.ballots, votingId: voting.id } };
}
