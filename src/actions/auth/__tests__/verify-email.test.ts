import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyEmailAction } from '@/actions/auth/verify-email';

const mocks = vi.hoisted(() => ({
  findVerificationByCode: vi.fn(),
  verifyEmailTransaction: vi.fn(),
  isVerificationExpired: vi.fn(),
  recordEmailVerification: vi.fn(),
}));

vi.mock('@/lib/queries/email-verification/find-verification-by-code', () => ({
  findVerificationByCode: mocks.findVerificationByCode,
}));
vi.mock('@/lib/mutations/email-verification/verify-email-transaction', () => ({
  verifyEmailTransaction: mocks.verifyEmailTransaction,
}));
vi.mock('@/lib/email/verification-utils', () => ({
  hashToken: (token: string) => `hashed-${token}`,
  isVerificationExpired: mocks.isVerificationExpired,
}));
vi.mock('@/lib/opentelemetry/auth-metrics', () => ({
  authMetrics: { recordEmailVerification: mocks.recordEmailVerification },
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const verification = {
  id: 'verification-1',
  userId: 'user-1',
  verified: false,
  expiresAt: new Date('2030-01-01'),
  user: { email: 'jan@example.com', emailVerified: false },
};

describe('verifyEmailAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findVerificationByCode.mockResolvedValue(verification);
    mocks.isVerificationExpired.mockReturnValue(false);
    mocks.verifyEmailTransaction.mockResolvedValue(true);
  });

  it('requires a token', async () => {
    expect(await verifyEmailAction('')).toEqual({
      ok: false,
      code: 'invalid',
      error: 'Token weryfikacyjny jest wymagany',
    });
    expect(mocks.findVerificationByCode).not.toHaveBeenCalled();
  });

  it('rejects an unknown token', async () => {
    mocks.findVerificationByCode.mockResolvedValue(null);

    expect(await verifyEmailAction('abc')).toEqual({
      ok: false,
      code: 'invalid',
      error: 'Nieprawidłowy token weryfikacyjny',
    });
    expect(mocks.findVerificationByCode).toHaveBeenCalledWith('hashed-abc');
  });

  it('rejects a token that was already used', async () => {
    mocks.findVerificationByCode.mockResolvedValue({
      ...verification,
      verified: true,
    });

    expect(await verifyEmailAction('abc')).toMatchObject({
      ok: false,
      error: 'Ten token został już użyty',
    });
  });

  it('rejects an expired token without verifying', async () => {
    mocks.isVerificationExpired.mockReturnValue(true);

    expect(await verifyEmailAction('abc')).toMatchObject({
      ok: false,
      error: 'Token weryfikacyjny wygasł. Poproś o nowy link.',
    });
    expect(mocks.verifyEmailTransaction).not.toHaveBeenCalled();
  });

  it('verifies the email and records the metric', async () => {
    expect(await verifyEmailAction('abc')).toEqual({
      ok: true,
      data: undefined,
    });
    expect(mocks.verifyEmailTransaction).toHaveBeenCalledWith(
      'user-1',
      'verification-1'
    );
    expect(mocks.recordEmailVerification).toHaveBeenCalledWith('success');
  });

  it('rejects a token consumed by a concurrent request', async () => {
    mocks.verifyEmailTransaction.mockResolvedValue(false);

    expect(await verifyEmailAction('abc')).toMatchObject({
      ok: false,
      error: 'Ten token został już użyty',
    });
    expect(mocks.recordEmailVerification).not.toHaveBeenCalled();
  });

  it('returns a generic failure and records it when verification throws', async () => {
    mocks.verifyEmailTransaction.mockRejectedValue(new Error('db'));

    expect(await verifyEmailAction('abc')).toMatchObject({
      ok: false,
      code: 'failed',
    });
    expect(mocks.recordEmailVerification).toHaveBeenCalledWith('failure');
  });
});
