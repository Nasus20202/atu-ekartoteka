import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetPasswordAction } from '@/actions/auth/reset-password';
import { AuthMethod } from '@/lib/types';

const mocks = vi.hoisted(() => ({
  findPasswordResetByToken: vi.fn(),
  resetPasswordTransaction: vi.fn(),
  verifyTurnstileToken: vi.fn(),
  recordPasswordReset: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(() => Promise.resolve('hashed-password')) },
}));
vi.mock('@/lib/queries/password-reset/find-password-reset-by-token', () => ({
  findPasswordResetByToken: mocks.findPasswordResetByToken,
}));
vi.mock('@/lib/mutations/password-reset/reset-password-transaction', () => ({
  resetPasswordTransaction: mocks.resetPasswordTransaction,
}));
vi.mock('@/lib/email/verification-utils', () => ({
  hashToken: (token: string) => `hashed-${token}`,
}));
vi.mock('@/lib/opentelemetry/auth-metrics', () => ({
  authMetrics: { recordPasswordReset: mocks.recordPasswordReset },
}));
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileToken: mocks.verifyTurnstileToken,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const INPUT = {
  token: 'valid-token',
  password: 'newpass123',
  turnstileToken: 'test-turnstile-token',
};

function resetRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reset-123',
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 3600000),
    used: false,
    user: {
      email: 'test@example.com',
      authMethod: AuthMethod.CREDENTIALS,
    },
    ...overrides,
  };
}

describe('resetPasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyTurnstileToken.mockResolvedValue(true);
    mocks.resetPasswordTransaction.mockResolvedValue(true);
    mocks.findPasswordResetByToken.mockResolvedValue(resetRecord());
  });

  it('requires a token and a password', async () => {
    expect(await resetPasswordAction({ ...INPUT, password: '' })).toEqual({
      ok: false,
      code: 'invalid',
      error: 'Token i hasło są wymagane',
    });
    expect(mocks.findPasswordResetByToken).not.toHaveBeenCalled();
  });

  it('rejects a password that is too short', async () => {
    expect(
      await resetPasswordAction({ ...INPUT, password: 'short' })
    ).toMatchObject({
      ok: false,
      code: 'invalid',
      error: 'Hasło musi mieć co najmniej 8 znaków',
    });
  });

  it('rejects a failed Turnstile check before looking at the token', async () => {
    mocks.verifyTurnstileToken.mockResolvedValueOnce(false);

    expect(await resetPasswordAction(INPUT)).toMatchObject({
      ok: false,
      error: 'Nieprawidłowe potwierdzenie turnstile',
    });
    expect(mocks.findPasswordResetByToken).not.toHaveBeenCalled();
  });

  it('rejects an unknown token', async () => {
    mocks.findPasswordResetByToken.mockResolvedValue(null);

    expect(await resetPasswordAction(INPUT)).toMatchObject({
      ok: false,
      error: 'Nieprawidłowy lub wygasły token',
    });
    expect(mocks.findPasswordResetByToken).toHaveBeenCalledWith(
      'hashed-valid-token'
    );
  });

  it('rejects an expired token', async () => {
    mocks.findPasswordResetByToken.mockResolvedValue(
      resetRecord({ expiresAt: new Date(Date.now() - 1000) })
    );

    expect(await resetPasswordAction(INPUT)).toMatchObject({
      ok: false,
      error: 'Token wygasł',
    });
    expect(mocks.resetPasswordTransaction).not.toHaveBeenCalled();
  });

  it('rejects a token that was already used', async () => {
    mocks.findPasswordResetByToken.mockResolvedValue(
      resetRecord({ used: true })
    );

    expect(await resetPasswordAction(INPUT)).toMatchObject({
      ok: false,
      error: 'Token został już użyty',
    });
    expect(mocks.resetPasswordTransaction).not.toHaveBeenCalled();
  });

  it('stores a bcrypt hash and consumes the token in one transaction', async () => {
    expect(await resetPasswordAction(INPUT)).toEqual({
      ok: true,
      data: undefined,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', expect.any(Number));
    expect(mocks.resetPasswordTransaction).toHaveBeenCalledWith(
      'user-123',
      'hashed-password',
      'reset-123'
    );
    expect(mocks.recordPasswordReset).toHaveBeenCalledWith('success');
  });

  it('does not change the password when the token was consumed concurrently', async () => {
    mocks.resetPasswordTransaction.mockResolvedValue(false);

    expect(await resetPasswordAction(INPUT)).toMatchObject({
      ok: false,
      error: 'Token został już użyty',
    });
    expect(mocks.recordPasswordReset).not.toHaveBeenCalled();
  });

  it('blocks OAuth accounts from resetting a password', async () => {
    mocks.findPasswordResetByToken.mockResolvedValue(
      resetRecord({
        user: { email: 'google@example.com', authMethod: AuthMethod.GOOGLE },
      })
    );

    expect(await resetPasswordAction(INPUT)).toMatchObject({
      ok: false,
      error:
        'Konto Google nie może resetować hasła. Użyj logowania przez Google.',
    });
    expect(mocks.resetPasswordTransaction).not.toHaveBeenCalled();
  });

  it('returns a generic failure and records it on an unexpected error', async () => {
    mocks.resetPasswordTransaction.mockRejectedValue(new Error('db'));

    expect(await resetPasswordAction(INPUT)).toEqual({
      ok: false,
      code: 'failed',
      error: 'Nie udało się zresetować hasła',
    });
    expect(mocks.recordPasswordReset).toHaveBeenCalledWith('failure');
  });
});
