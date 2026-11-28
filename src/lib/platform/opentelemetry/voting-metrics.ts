/**
 * Voting Metrics
 *
 * Tracks the voting lifecycle: status changes, the steps of the emailed ballot
 * confirmation, ballots stored, meeting ballots and votings per status. Voting emails are
 * counted by the email metrics.
 * Attributes carry no ids, names or e-mail addresses.
 *
 * NOTE: Logger is imported lazily, like in database-metrics.
 */

import { type Meter, metrics, type ObservableResult } from '@opentelemetry/api';

import { COUNT_REFRESH_INTERVAL_MS } from '@/lib/platform/opentelemetry/database-metrics';
import { countVotingsByStatus } from '@/lib/voting/queries/count-votings-by-status';
import { VotingStatus } from '@/lib/voting/types/voting';

const VOTING_METER_NAME = 'ekartoteka.voting';

type VotingStatusLabel = 'draft' | 'active' | 'closed' | 'archived';
export type RejectionReason =
  'invalid_link' | 'foreign_link' | 'expired' | 'closed' | 'already_voted';

/** One step of the confirmation: a link requested, or a link opened. */
export type ConfirmationOutcome =
  | { result: 'requested' | 'email_failed' | 'rate_limited' | 'confirmed' }
  | { result: 'rejected'; reason: RejectionReason };

const STATUS_LABELS: Record<VotingStatus, VotingStatusLabel> = {
  [VotingStatus.DRAFT]: 'draft',
  [VotingStatus.ACTIVE]: 'active',
  [VotingStatus.CLOSED]: 'closed',
  [VotingStatus.ARCHIVED]: 'archived',
};

const meter = metrics.getMeter(VOTING_METER_NAME);

const statusChangeCounter = meter.createCounter(
  'ekartoteka.voting.status_change',
  {
    description: 'Votings created as drafts, status transitions and deletions',
  }
);

const confirmationCounter = meter.createCounter(
  'ekartoteka.voting.confirmation',
  {
    description: 'Steps of the emailed ballot confirmation',
  }
);

const ballotCounter = meter.createCounter('ekartoteka.voting.ballot', {
  description: 'Number of ballots stored',
});

const meetingBallotCounter = meter.createCounter(
  'ekartoteka.voting.meeting_ballot',
  {
    description: 'Meeting ballots entered or removed by an admin',
  }
);

export const votingMetrics = {
  recordStatusChange(status: VotingStatus) {
    statusChangeCounter.add(1, { status: STATUS_LABELS[status] });
  },

  recordDeletion() {
    statusChangeCounter.add(1, { status: 'deleted' });
  },

  recordMeetingBallot(action: 'added' | 'removed') {
    meetingBallotCounter.add(1, { action });
  },

  recordConfirmation(outcome: ConfirmationOutcome) {
    confirmationCounter.add(1, outcome);
  },

  recordBallots(count: number) {
    ballotCounter.add(count);
  },
};

/**
 * Observable gauge with the number of votings per status. The counts are read
 * from the database every 30 seconds; the callback only reports the cache.
 */
export async function registerVotingCountMetrics(meter: Meter) {
  const countGauge = meter.createObservableGauge('ekartoteka.voting.count', {
    description: 'Number of votings per status',
  });

  let latest: Record<VotingStatus, number> | undefined;

  async function updateCounts() {
    try {
      latest = await countVotingsByStatus();
    } catch (error) {
      // Lazy import as logger might not be traced yet
      const { logger } = await import('@/lib/platform/logging/logger');
      logger.error({ error }, 'Failed to update voting counts');
    }
  }

  await updateCounts();
  setInterval(updateCounts, COUNT_REFRESH_INTERVAL_MS);

  countGauge.addCallback((result: ObservableResult) => {
    if (!latest) return;
    for (const status of Object.values(VotingStatus)) {
      result.observe(latest[status], { status: STATUS_LABELS[status] });
    }
  });
}
