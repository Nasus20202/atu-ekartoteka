/**
 * Authentication Metrics
 *
 * Tracks authentication events and user statistics.
 */

import { metrics } from '@opentelemetry/api';

const AUTH_METER_NAME = 'ekartoteka.auth';

type AuthProvider = 'credentials' | 'google';
type AuthResult = 'success' | 'failure';
type InviteResult = 'success' | 'email_failed' | 'skipped' | 'failure';

export type InviteCounts = Record<InviteResult, number>;
type FailureReason =
  | 'invalid_credentials'
  | 'user_not_found'
  | 'no_password'
  | 'invalid_turnstile'
  | 'missing_turnstile'
  | 'google_email_unverified'
  | 'google_error';

const meter = metrics.getMeter(AUTH_METER_NAME);

// Counter for login attempts
const loginCounter = meter.createCounter('ekartoteka.auth.login', {
  description: 'Number of login attempts',
});

// Counter for registrations
const registrationCounter = meter.createCounter(
  'ekartoteka.auth.registration',
  {
    description: 'Number of user registrations',
  }
);

// Counter for password reset requests
const passwordResetCounter = meter.createCounter(
  'ekartoteka.auth.password_reset',
  {
    description: 'Number of password reset requests',
  }
);

// Counter for email verification events
const emailVerificationCounter = meter.createCounter(
  'ekartoteka.auth.email_verification',
  {
    description: 'Number of email verification events',
  }
);

// Counter for accounts an admin invites by e-mail
const inviteCounter = meter.createCounter('ekartoteka.auth.invite', {
  description: 'Number of accounts invited by an admin, by result',
});

export const authMetrics = {
  recordLogin(
    provider: AuthProvider,
    result: AuthResult,
    reason?: FailureReason
  ) {
    loginCounter.add(1, {
      provider,
      result,
      ...(reason && { reason }),
    });
  },

  recordRegistration(provider: AuthProvider, result: AuthResult) {
    registrationCounter.add(1, { provider, result });
  },

  recordPasswordReset(result: AuthResult) {
    passwordResetCounter.add(1, { result });
  },

  recordEmailVerification(result: AuthResult) {
    emailVerificationCounter.add(1, { result });
  },

  recordInvites(counts: InviteCounts) {
    for (const [result, count] of Object.entries(counts)) {
      if (count > 0) inviteCounter.add(count, { result });
    }
  },
};
