import { getEmailService } from '@/lib/platform/email/email-service';
import { createLogger } from '@/lib/platform/logging/logger';
import { votingMetrics } from '@/lib/platform/opentelemetry/voting-metrics';
import {
  invalidResult,
  notFoundResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { formatDateTime } from '@/lib/shared/utils/format-date-time';
import { findEligibleRecipients } from '@/lib/voting/queries/find-eligible-voters';
import { findVotingById } from '@/lib/voting/queries/find-voting-by-id';
import { MAX_NOTIFICATION_RECIPIENTS } from '@/lib/voting/rules/voting-constants';
import { isVotingOpen } from '@/lib/voting/rules/voting-status';

const logger = createLogger('voting:notify');

export interface NotifyVotersResult {
  sent: number;
  failed: number;
}

/** Emails the selected users; ids that are not eligible voters of the HOA are ignored. */
export async function notifyVoters(
  adminId: string,
  votingId: unknown,
  userIds: unknown
): Promise<UseCaseResult<NotifyVotersResult>> {
  if (
    typeof votingId !== 'string' ||
    !Array.isArray(userIds) ||
    userIds.length === 0 ||
    userIds.length > MAX_NOTIFICATION_RECIPIENTS ||
    userIds.some((id) => typeof id !== 'string')
  ) {
    return invalidResult('Wybierz odbiorców powiadomienia');
  }

  const voting = await findVotingById(votingId);
  if (!voting) return notFoundResult('Nie znaleziono głosowania');

  if (!isVotingOpen(voting, new Date())) {
    return invalidResult('Powiadomić można tylko o aktywnym głosowaniu');
  }

  const recipients = await findEligibleRecipients(voting.hoa.id, [
    ...new Set<string>(userIds),
  ]);

  const endsAt = voting.endsAt ? formatDateTime(voting.endsAt) : undefined;
  const emailService = getEmailService();
  const results = await Promise.all(
    recipients.map((recipient) =>
      emailService.sendVotingNotificationEmail(
        recipient.email,
        voting.id,
        voting.title,
        voting.hoa.name,
        endsAt,
        recipient.name ?? undefined
      )
    )
  );

  const sent = results.filter((result) => result.ok).length;
  const failed = results.length - sent;
  votingMetrics.recordNotifications(sent, failed);
  logger.info({ adminId, votingId, sent, failed }, 'Voting notifications sent');

  return { ok: true, data: { sent, failed } };
}
