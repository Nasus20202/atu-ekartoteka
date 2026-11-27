import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';
import { votingMetrics } from '@/lib/platform/opentelemetry/voting-metrics';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { findUserById } from '@/lib/users/queries/find-user-by-id';
import { deleteVoteConfirmation } from '@/lib/voting/mutations/delete-vote-confirmation';
import { saveVoteConfirmation } from '@/lib/voting/mutations/save-vote-confirmation';
import { findRecentVoteConfirmation } from '@/lib/voting/queries/find-recent-vote-confirmation';
import { findVotableApartments } from '@/lib/voting/queries/find-voter-apartments';
import {
  confirmationExpiry,
  generateConfirmationToken,
  hashConfirmationToken,
  minutesUntilNextLink,
} from '@/lib/voting/rules/confirmation-token';
import { toEmailBallots } from '@/lib/voting/rules/email-ballots';
import { CONFIRMATION_TTL_MINUTES } from '@/lib/voting/rules/voting-constants';
import { parseBallotAnswers } from '@/lib/voting/rules/voting-input';
import { voteChoices } from '@/lib/voting/rules/voting-status';
import { resolveOpenVoting } from '@/lib/voting/use-cases/vote-access';

const logger = createLogger('voting:request-confirmation');

/** Stores the answers and emails the one-time link that confirms them. */
export async function requestVoteConfirmation(
  userId: string,
  votingId: unknown,
  rawAnswers: unknown
): Promise<UseCaseResult<{ expiresAt: string }>> {
  const access = await resolveOpenVoting(userId, votingId, new Date());
  if ('failure' in access) return access.failure;
  const { voting } = access;

  const votable = await findVotableApartments(userId, voting.hoa.id, voting.id);
  if (votable.length === 0) {
    return invalidResult('Oddano już głosy za wszystkie Twoje lokale');
  }

  const answers = parseBallotAnswers(
    rawAnswers,
    votable.map((apartment) => apartment.id),
    voting.questions.map((question) => question.id),
    voteChoices(voting.allowAbstain)
  );
  if (!answers.ok) return invalidResult(answers.message);

  const now = new Date();
  const recent = await findRecentVoteConfirmation(userId, now);
  if (recent) {
    votingMetrics.recordConfirmation({ result: 'rate_limited' });
    return invalidResult(
      `Poczekaj ${minutesUntilNextLink(recent.createdAt, now)} min przed ponownym wysłaniem linku`
    );
  }

  const user = await findUserById(userId);
  if (!user) return failedResult('Nie udało się wysłać linku');

  const token = generateConfirmationToken();
  const expiresAt = confirmationExpiry(now);

  const id = await saveVoteConfirmation({
    votingId: voting.id,
    userId,
    tokenHash: hashConfirmationToken(token),
    answers: answers.value,
    expiresAt,
  });

  const sent = await getEmailService().sendVoteConfirmationEmail(
    user.email,
    token,
    voting.title,
    toEmailBallots(votable, voting.questions, answers.value),
    CONFIRMATION_TTL_MINUTES,
    user.name ?? undefined
  );

  if (!sent.ok) {
    await deleteVoteConfirmation(id);
    votingMetrics.recordConfirmation({ result: 'email_failed' });
    logger.error({ userId, votingId: voting.id }, 'Confirmation email failed');
    return failedResult('Nie udało się wysłać linku. Spróbuj ponownie później');
  }

  votingMetrics.recordConfirmation({ result: 'requested' });
  logger.info({ userId, votingId: voting.id }, 'Vote confirmation requested');

  return { ok: true, data: { expiresAt: expiresAt.toISOString() } };
}
