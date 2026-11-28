/**
 * The custom metrics the OpenTelemetry metrics spec expects to be exported, and
 * the points each flow must have counted. Matching helpers live in ./otlp.
 */

import type { CapturedMetric } from './otlp-capture';

export const DB_SIZE_METRIC = 'ekartoteka.db.size';
export const IMPORT_RUN_METRIC = 'ekartoteka.import.run';
export const IMPORT_FINDINGS_METRIC = 'ekartoteka.import.findings';
export const USER_TABLE = { table: 'user' };
export const TRACKED_TABLES = [
  'homeownersAssociation',
  'apartment',
  'charge',
  'chargeNotification',
  'payment',
  'user',
  'utilitySettlement',
  'meterReading',
  'annualCostSettlement',
  'voting',
  'votingBallot',
  'votingConfirmation',
];
export const VOTING_COUNT_METRIC = 'ekartoteka.voting.count';
export const VOTING_STATUSES = ['draft', 'active', 'closed', 'archived'];

const CREDENTIALS = { provider: 'credentials' };

/** Metric name and attributes of every point the flows must count. */
export const EXPECTED_POINTS: [string, Record<string, string>][] = [
  ['ekartoteka.auth.login', { ...CREDENTIALS, result: 'success' }],
  [
    'ekartoteka.auth.login',
    { ...CREDENTIALS, result: 'failure', reason: 'invalid_turnstile' },
  ],
  [
    'ekartoteka.auth.login',
    { ...CREDENTIALS, result: 'failure', reason: 'user_not_found' },
  ],
  [
    'ekartoteka.auth.login',
    { ...CREDENTIALS, result: 'failure', reason: 'invalid_credentials' },
  ],
  ['ekartoteka.auth.registration', { ...CREDENTIALS, result: 'success' }],
  ['ekartoteka.auth.email_verification', { result: 'success' }],
  ['ekartoteka.auth.password_reset', { result: 'success' }],
  ['ekartoteka.auth.invite', { result: 'success' }],
  ['ekartoteka.email.sent', { type: 'verification', result: 'success' }],
  ['ekartoteka.email.sent', { type: 'admin_notification', result: 'success' }],
  ['ekartoteka.email.sent', { type: 'password_reset', result: 'success' }],
  [IMPORT_RUN_METRIC, { type: 'settlement_preview', result: 'failure' }],
  [
    IMPORT_FINDINGS_METRIC,
    {
      type: 'settlement_preview',
      severity: 'error',
      kind: 'unknown-document',
    },
  ],
];

// The database validation finds different things on each run, so only its type is fixed
export const hasImportRunOfType = (metrics: CapturedMetric[], type: string) =>
  metrics.some(
    (metric) =>
      metric.name === IMPORT_RUN_METRIC &&
      metric.points.some(
        (point) => point.value >= 1 && point.attributes.type === type
      )
  );
