import type { RejectionReason } from '@/lib/platform/opentelemetry/voting-metrics';
import type { UseCaseFailure } from '@/lib/shared/use-case-result';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';
import type { ApartmentBallotDto } from '@/lib/voting/dto/own-ballot-dto';
import { toVotingDto, type VotingDto } from '@/lib/voting/dto/voting-dto';
import { findVoteConfirmationByToken } from '@/lib/voting/queries/find-vote-confirmation';
import { findOwnedApartments } from '@/lib/voting/queries/find-voter-apartments';
import {
  hashConfirmationToken,
  isConfirmationTokenFormat,
} from '@/lib/voting/rules/confirmation-token';
import { parseBallotAnswers } from '@/lib/voting/rules/voting-input';
import { voteChoices } from '@/lib/voting/rules/voting-status';
import type { BallotAnswers } from '@/lib/voting/types/voting';
import {
  type AccessDenial,
  resolveOpenVoting,
} from '@/lib/voting/use-cases/vote-access';

/** Why an emailed link cannot be used. The caller decides what a refusal does. */
export type VoteLinkRejection =
  | { reason: 'invalid-link' }
  | { reason: 'foreign-link'; ownerId: string }
  | { reason: 'expired'; confirmationId: string }
  | { reason: 'unreadable-answers'; confirmationId: string }
  | { reason: AccessDenial; failure: UseCaseFailure };

export interface UsableVoteLink {
  confirmationId: string;
  voting: VotingDto;
  answers: BallotAnswers;
  /** The same answers with the apartment each of them is for */
  ballots: ApartmentBallotDto[];
}

export type VoteLinkResolution =
  | { ok: true; link: UsableVoteLink }
  | { ok: false; rejection: VoteLinkRejection };

const METRIC_REASONS: Record<
  VoteLinkRejection['reason'],
  RejectionReason | null
> = {
  'invalid-link': 'invalid_link',
  'foreign-link': 'foreign_link',
  expired: 'expired',
  'unreadable-answers': 'invalid_link',
  'no-access': null,
  'not-found': 'closed',
  closed: 'closed',
};

/** The metric reason counted for a refused link, or null when it is not counted. */
export function linkRejectionMetric(
  rejection: VoteLinkRejection
): RejectionReason | null {
  return METRIC_REASONS[rejection.reason];
}

const asEntries = (stored: unknown): Record<string, unknown> =>
  typeof stored === 'object' && stored !== null
    ? (stored as Record<string, unknown>)
    : {};

function refuse(rejection: VoteLinkRejection): VoteLinkResolution {
  return { ok: false, rejection };
}

/**
 * Read-only check of an emailed vote link for the signed-in user, at `now`.
 * It writes nothing: confirmVote removes expired and unreadable links, the
 * confirmation page only shows the refusal.
 */
export async function resolveVoteLink(input: {
  userId: string;
  token: unknown;
  now: Date;
}): Promise<VoteLinkResolution> {
  const { userId, token, now } = input;

  if (!isConfirmationTokenFormat(token)) {
    return refuse({ reason: 'invalid-link' });
  }

  const pending = await findVoteConfirmationByToken(
    hashConfirmationToken(token)
  );
  if (!pending) return refuse({ reason: 'invalid-link' });

  // A link opened by anyone but its owner looks the same as an unknown one
  if (pending.userId !== userId) {
    return refuse({ reason: 'foreign-link', ownerId: pending.userId });
  }

  if (pending.expiresAt.getTime() <= now.getTime()) {
    return refuse({ reason: 'expired', confirmationId: pending.id });
  }

  const access = await resolveOpenVoting(userId, pending.votingId, now);
  if ('failure' in access) {
    return refuse({ reason: access.denial, failure: access.failure });
  }

  const voting = toVotingDto(access.voting);
  const stored = asEntries(pending.answers);
  const apartments = await findOwnedApartments(
    userId,
    voting.hoaId,
    Object.keys(stored)
  );
  // Apartments the user no longer owns drop out; none left makes the link useless
  const answers = parseBallotAnswers(
    Object.fromEntries(apartments.map(({ id }) => [id, stored[id]])),
    apartments.map((apartment) => apartment.id),
    voting.questions.map((question) => question.id),
    voteChoices(voting.allowAbstain)
  );
  if (!answers.ok) {
    return refuse({
      reason: 'unreadable-answers',
      confirmationId: pending.id,
    });
  }

  return {
    ok: true,
    link: {
      confirmationId: pending.id,
      voting,
      answers: answers.value,
      ballots: apartments.map(({ id, ...apartment }) => ({
        apartmentId: id,
        apartment: formatApartmentLabel(apartment),
        answers: answers.value[id],
      })),
    },
  };
}
