import { createLogger } from '@/lib/platform/logging/logger';
import {
  type RejectionReason,
  votingMetrics,
} from '@/lib/platform/opentelemetry/voting-metrics';
import {
  failedResult,
  invalidResult,
  type UseCaseFailure,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import {
  castBallots,
  type CastBallotsResult,
} from '@/lib/voting/mutations/cast-ballots';
import { deleteVoteConfirmation } from '@/lib/voting/mutations/delete-vote-confirmation';
import {
  linkRejectionMetric,
  resolveVoteLink,
  type VoteLinkRejection,
} from '@/lib/voting/use-cases/resolve-vote-link';
import { VOTING_ENDED } from '@/lib/voting/use-cases/vote-access';

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

const CAST_REJECTIONS: Record<
  Extract<CastBallotsResult, { ok: false }>['reason'],
  RejectionReason
> = {
  closed: 'closed',
  consumed: 'invalid_link',
  'nothing-to-vote': 'already_voted',
  duplicate: 'already_voted',
};

function countRejection(reason: RejectionReason) {
  votingMetrics.recordConfirmation({ result: 'rejected', reason });
}

/** Records a refused link, drops the ones that can never be used again, and returns the failure. */
async function refuse(
  userId: string,
  rejection: VoteLinkRejection
): Promise<UseCaseFailure> {
  if (rejection.reason === 'foreign-link') {
    logger.warn({ userId, ownerId: rejection.ownerId }, 'Foreign vote link');
  }
  if (
    rejection.reason === 'expired' ||
    rejection.reason === 'unreadable-answers'
  ) {
    await deleteVoteConfirmation(rejection.confirmationId);
  }

  const metricReason = linkRejectionMetric(rejection);
  if (metricReason) countRejection(metricReason);

  // Access denials carry their own message; a bad link gets the generic one
  return 'failure' in rejection
    ? rejection.failure
    : invalidResult(LINK_INVALID);
}

/** Redeems the emailed link of the signed-in user and stores the ballots. */
export async function confirmVote(
  userId: string,
  token: unknown
): Promise<UseCaseResult<{ ballots: number; votingId: string }>> {
  const resolved = await resolveVoteLink({ userId, token, now: new Date() });
  if (!resolved.ok) return refuse(userId, resolved.rejection);

  const { link } = resolved;
  const result = await castBallots({
    confirmationId: link.confirmationId,
    votingId: link.voting.id,
    hoaId: link.voting.hoaId,
    userId,
    answers: link.answers,
    now: new Date(),
  });

  if (!result.ok) {
    const failure =
      result.reason === 'duplicate'
        ? failedResult(CAST_FAILURES.duplicate)
        : invalidResult(CAST_FAILURES[result.reason]);
    countRejection(CAST_REJECTIONS[result.reason]);
    return failure;
  }

  votingMetrics.recordConfirmation({ result: 'confirmed' });
  votingMetrics.recordBallots(result.ballots);
  logger.info(
    { userId, votingId: link.voting.id, ballots: result.ballots },
    'Vote cast'
  );

  return {
    ok: true,
    data: { ballots: result.ballots, votingId: link.voting.id },
  };
}
