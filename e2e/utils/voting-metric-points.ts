/**
 * Metric names and the points the voting flows are expected to export. A point
 * is listed once its flow has counted it at least once.
 */

export const CONFIRMATION = 'ekartoteka.voting.confirmation';
export const STATUS_CHANGE = 'ekartoteka.voting.status_change';
export const VOTING_COUNT = 'ekartoteka.voting.count';
export const BALLOT = 'ekartoteka.voting.ballot';
export const NOTIFICATION = 'ekartoteka.voting.notification';

export const VOTING_STATUSES = [
  'draft',
  'active',
  'closed',
  'archived',
] as const;

export const EXPECTED_POINTS: [string, Record<string, string>][] = [
  ...VOTING_STATUSES.map((status): [string, Record<string, string>] => [
    STATUS_CHANGE,
    { status },
  ]),
  [CONFIRMATION, { result: 'requested' }],
  [CONFIRMATION, { result: 'rate_limited' }],
  [CONFIRMATION, { result: 'confirmed' }],
  [CONFIRMATION, { result: 'rejected', reason: 'invalid_link' }],
  [CONFIRMATION, { result: 'rejected', reason: 'expired' }],
  [CONFIRMATION, { result: 'rejected', reason: 'closed' }],
  [NOTIFICATION, { result: 'success' }],
  [BALLOT, {}],
];
