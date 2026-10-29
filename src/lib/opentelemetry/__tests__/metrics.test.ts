import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAdd } = vi.hoisted(() => ({ mockAdd: vi.fn() }));

vi.mock('@opentelemetry/api', () => ({
  metrics: {
    getMeter: () => ({ createCounter: () => ({ add: mockAdd }) }),
  },
}));

import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { emailMetrics } from '@/lib/opentelemetry/email-metrics';

describe('authMetrics', () => {
  beforeEach(() => {
    mockAdd.mockClear();
  });

  it('records a login with a failure reason', () => {
    authMetrics.recordLogin('credentials', 'failure', 'user_not_found');

    expect(mockAdd).toHaveBeenCalledWith(1, {
      provider: 'credentials',
      result: 'failure',
      reason: 'user_not_found',
    });
  });

  it('records a login without a reason', () => {
    authMetrics.recordLogin('google', 'success');

    expect(mockAdd).toHaveBeenCalledWith(1, {
      provider: 'google',
      result: 'success',
    });
  });

  it('records registrations, password resets and verifications', () => {
    authMetrics.recordRegistration('credentials', 'success');
    authMetrics.recordPasswordReset('failure');
    authMetrics.recordEmailVerification('success');

    expect(mockAdd.mock.calls).toEqual([
      [1, { provider: 'credentials', result: 'success' }],
      [1, { result: 'failure' }],
      [1, { result: 'success' }],
    ]);
  });
});

describe('emailMetrics', () => {
  it('records a sent email', () => {
    mockAdd.mockClear();
    emailMetrics.recordEmailSent('verification', 'skipped');

    expect(mockAdd).toHaveBeenCalledWith(1, {
      type: 'verification',
      result: 'skipped',
    });
  });
});
