/**
 * Email Metrics
 *
 * Tracks email sending events and statistics.
 */

import { metrics } from '@opentelemetry/api';

import type { EmailType } from '@/lib/email/email-types';

const EMAIL_METER_NAME = 'ekartoteka.email';

type EmailResult = 'success' | 'failure' | 'skipped';

const meter = metrics.getMeter(EMAIL_METER_NAME);

// Counter for emails sent
const emailCounter = meter.createCounter('ekartoteka.email.sent', {
  description: 'Number of emails sent',
});

export const emailMetrics = {
  recordEmailSent(type: EmailType, result: EmailResult) {
    emailCounter.add(1, { type, result });
  },
};
