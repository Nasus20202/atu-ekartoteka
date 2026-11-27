import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { findUserById } from '@/lib/users/queries/find-user-by-id';
import { deleteVoteConfirmation } from '@/lib/voting/mutations/delete-vote-confirmation';
import { saveVoteConfirmation } from '@/lib/voting/mutations/save-vote-confirmation';
import { findRecentVoteConfirmation } from '@/lib/voting/queries/find-recent-vote-confirmation';
import { findVotableApartmentIds } from '@/lib/voting/queries/find-voter-apartments';
import {
  confirmationExpiry,
  generateConfirmationToken,
  hashConfirmationToken,
  minutesUntilNextLink,
} from '@/lib/voting/rules/confirmation-token';
import { CONFIRMATION_TTL_MINUTES } from '@/lib/voting/rules/voting-constants';
import { parseAnswers } from '@/lib/voting/rules/voting-input';
import { resolveOpenVoting } from '@/lib/voting/use-cases/vote-access';

const logger = createLogger('voting:request-confirmation');

/** Stores the answers and emails the one-time link that confirms them. */
export async function requestVoteConfirmation(
  userId: string,
  votingId: unknown,
  rawAnswers: unknown
): Promise<UseCaseResult<{ expiresAt: string }>> {
  const access = await resolveOpenVoting(userId, votingId);
  if ('failure' in access) return access.failure;
  const { voting } = access;

  const answers = parseAnswers(
    rawAnswers,
    voting.questions.map((question) => question.id)
  );
  if (!answers.ok) return invalidResult(answers.message);

  const votable = await findVotableApartmentIds(
    userId,
    voting.hoa.id,
    voting.id
  );
  if (votable.length === 0) {
    return invalidResult('Oddano już głosy za wszystkie Twoje lokale');
  }

  const now = new Date();
  const recent = await findRecentVoteConfirmation(userId, now);
  if (recent) {
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
    CONFIRMATION_TTL_MINUTES,
    user.name ?? undefined
  );

  if (!sent.ok) {
    await deleteVoteConfirmation(id);
    logger.error({ userId, votingId: voting.id }, 'Confirmation email failed');
    return failedResult('Nie udało się wysłać linku. Spróbuj ponownie później');
  }

  logger.info({ userId, votingId: voting.id }, 'Vote confirmation requested');

  return { ok: true, data: { expiresAt: expiresAt.toISOString() } };
}
