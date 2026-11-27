import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { findUserById } from '@/lib/users/queries/find-user-by-id';
import { saveVoteConfirmation } from '@/lib/voting/mutations/save-vote-confirmation';
import { deleteVoteConfirmation } from '@/lib/voting/mutations/vote-confirmation-attempts';
import { findRecentVoteConfirmation } from '@/lib/voting/queries/find-recent-vote-confirmation';
import { findVotableApartmentIds } from '@/lib/voting/queries/find-voter-apartments';
import {
  confirmationExpiry,
  generateConfirmationCode,
  hashConfirmationCode,
  minutesUntilNextCode,
  newConfirmationId,
} from '@/lib/voting/rules/confirmation-code';
import { CONFIRMATION_CODE_TTL_MINUTES } from '@/lib/voting/rules/voting-constants';
import { parseAnswers } from '@/lib/voting/rules/voting-input';
import { resolveOpenVoting } from '@/lib/voting/use-cases/vote-access';

const logger = createLogger('voting:request-confirmation');

/** Stores the answers and emails the one-time code that confirms them. */
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
      `Poczekaj ${minutesUntilNextCode(recent.createdAt, now)} min przed ponownym wysłaniem kodu`
    );
  }

  const user = await findUserById(userId);
  if (!user) return failedResult('Nie udało się wysłać kodu');

  const code = generateConfirmationCode();
  const id = newConfirmationId();
  const expiresAt = confirmationExpiry(now);

  await saveVoteConfirmation({
    id,
    votingId: voting.id,
    userId,
    codeHash: hashConfirmationCode(id, code),
    answers: answers.value,
    expiresAt,
  });

  const sent = await getEmailService().sendVoteConfirmationEmail(
    user.email,
    code,
    voting.title,
    CONFIRMATION_CODE_TTL_MINUTES,
    user.name ?? undefined
  );

  if (!sent.ok) {
    await deleteVoteConfirmation(id);
    logger.error({ userId, votingId: voting.id }, 'Confirmation email failed');
    return failedResult('Nie udało się wysłać kodu. Spróbuj ponownie później');
  }

  logger.info({ userId, votingId: voting.id }, 'Vote confirmation requested');

  return { ok: true, data: { expiresAt: expiresAt.toISOString() } };
}
