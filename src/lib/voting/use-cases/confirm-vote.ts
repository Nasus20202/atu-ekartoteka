import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { castBallots } from '@/lib/voting/mutations/cast-ballots';
import {
  deleteVoteConfirmation,
  registerConfirmationAttempt,
} from '@/lib/voting/mutations/vote-confirmation-attempts';
import { findVoteConfirmation } from '@/lib/voting/queries/find-vote-confirmation';
import {
  confirmationCodeMatches,
  isConfirmationCodeFormat,
} from '@/lib/voting/rules/confirmation-code';
import { MAX_CONFIRMATION_ATTEMPTS } from '@/lib/voting/rules/voting-constants';
import { parseAnswers } from '@/lib/voting/rules/voting-input';
import {
  resolveOpenVoting,
  VOTING_ENDED,
} from '@/lib/voting/use-cases/vote-access';

const logger = createLogger('voting:confirm');

const CODE_EXPIRED = 'Kod wygasł lub został już użyty. Poproś o nowy';
const TOO_MANY_ATTEMPTS =
  'Przekroczono liczbę prób. Poproś o nowy kod za kilka minut';
const WRONG_CODE = 'Nieprawidłowy kod';

const CAST_FAILURES = {
  closed: VOTING_ENDED,
  consumed: CODE_EXPIRED,
  'nothing-to-vote': 'Oddano już głosy za wszystkie Twoje lokale',
  duplicate: 'Oddano już głosy za wszystkie Twoje lokale',
} as const;

/** Checks the emailed code and, when it is right, stores the ballots. */
export async function confirmVote(
  userId: string,
  votingId: unknown,
  code: unknown
): Promise<UseCaseResult<{ ballots: number }>> {
  if (!isConfirmationCodeFormat(code)) return invalidResult(WRONG_CODE);

  const access = await resolveOpenVoting(userId, votingId);
  if ('failure' in access) return access.failure;
  const { voting } = access;

  const pending = await findVoteConfirmation(voting.id, userId);
  if (!pending) return invalidResult(CODE_EXPIRED);

  if (pending.expiresAt.getTime() <= Date.now()) {
    await deleteVoteConfirmation(pending.id);
    return invalidResult(CODE_EXPIRED);
  }

  const attempts = await registerConfirmationAttempt(pending.id);
  if (attempts === null) return invalidResult(CODE_EXPIRED);

  // An exhausted code stays until it expires, so the rate limit keeps holding
  if (attempts > MAX_CONFIRMATION_ATTEMPTS) {
    return invalidResult(TOO_MANY_ATTEMPTS);
  }

  if (!confirmationCodeMatches(pending.codeHash, pending.id, code)) {
    logger.warn({ userId, votingId: voting.id, attempts }, 'Wrong vote code');
    if (attempts >= MAX_CONFIRMATION_ATTEMPTS) {
      return invalidResult(TOO_MANY_ATTEMPTS);
    }
    return invalidResult(WRONG_CODE);
  }

  const answers = parseAnswers(
    pending.answers,
    voting.questions.map((question) => question.id)
  );
  if (!answers.ok) {
    await deleteVoteConfirmation(pending.id);
    return invalidResult(CODE_EXPIRED);
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

  return { ok: true, data: { ballots: result.ballots } };
}
