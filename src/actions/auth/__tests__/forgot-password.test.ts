import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forgotPasswordAction } from '@/actions/auth/forgot-password';
import { AuthMethod } from '@/lib/types';

const mocks = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  deletePasswordResetsForUser: vi.fn(),
  createPasswordReset: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  verifyTurnstileToken: vi.fn(),
}));

vi.mock('@/lib/queries/users/find-user-by-email', () => ({
  findUserByEmail: mocks.findUserByEmail,
}));
vi.mock(
  '@/lib/mutations/password-reset/delete-password-resets-for-user',
  () => ({
    deletePasswordResetsForUser: mocks.deletePasswordResetsForUser,
  })
);
vi.mock('@/lib/mutations/password-reset/create-password-reset', () => ({
  createPasswordReset: mocks.createPasswordReset,
}));
vi.mock('@/lib/email/email-service', () => ({
  getEmailService: () => ({
    sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  }),
}));
vi.mock('@/lib/email/verification-utils', () => ({
  generateSecureToken: () => 'test-token-123',
  hashToken: (token: string) => `hashed-${token}`,
}));
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileToken: mocks.verifyTurnstileToken,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const CREDENTIALS_USER = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  authMethod: AuthMethod.CREDENTIALS,
};

describe('forgotPasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyTurnstileToken.mockResolvedValue(true);
    mocks.findUserByEmail.mockResolvedValue(null);
  });

  it('rejects a failed Turnstile check', async () => {
    mocks.verifyTurnstileToken.mockResolvedValueOnce(false);

    expect(
      await forgotPasswordAction({
        email: 'test@example.com',
        turnstileToken: 'invalid-token',
      })
    ).toEqual({
      ok: false,
      code: 'invalid',
      error: 'Nieprawidłowe potwierdzenie turnstile',
    });
    expect(mocks.findUserByEmail).not.toHaveBeenCalled();
  });

  it('requires an email', async () => {
    expect(
      await forgotPasswordAction({
        email: '',
        turnstileToken: 'test-turnstile-token',
      })
    ).toEqual({ ok: false, code: 'invalid', error: 'Email jest wymagany' });
  });

  it('reports success without sending anything for an unknown email', async () => {
    expect(
      await forgotPasswordAction({
        email: 'nonexistent@example.com',
        turnstileToken: 'test-turnstile-token',
      })
    ).toEqual({ ok: true, data: undefined });
    expect(mocks.createPasswordReset).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('normalises the email before looking it up', async () => {
    await forgotPasswordAction({
      email: '  Test@Example.COM ',
      turnstileToken: 'test-turnstile-token',
    });

    expect(mocks.findUserByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('replaces old tokens, stores a hashed one and emails the plain token', async () => {
    mocks.findUserByEmail.mockResolvedValue(CREDENTIALS_USER);

    expect(
      await forgotPasswordAction({
        email: 'test@example.com',
        turnstileToken: 'test-turnstile-token',
      })
    ).toEqual({ ok: true, data: undefined });

    expect(mocks.deletePasswordResetsForUser).toHaveBeenCalledWith('user-123');
    expect(mocks.createPasswordReset).toHaveBeenCalledWith({
      userId: 'user-123',
      hashedToken: 'hashed-test-token-123',
      expiresAt: expect.any(Date),
    });
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      'test-token-123',
      'Test User'
    );
  });

  it('sends the reset email without a name when the user has none', async () => {
    mocks.findUserByEmail.mockResolvedValue({
      ...CREDENTIALS_USER,
      name: null,
    });

    await forgotPasswordAction({
      email: 'test@example.com',
      turnstileToken: 'test-turnstile-token',
    });

    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      'test-token-123',
      undefined
    );
  });

  it('reports success but does not reset OAuth-only accounts', async () => {
    mocks.findUserByEmail.mockResolvedValue({
      ...CREDENTIALS_USER,
      authMethod: AuthMethod.GOOGLE,
    });

    expect(
      await forgotPasswordAction({
        email: 'test@example.com',
        turnstileToken: 'test-turnstile-token',
      })
    ).toEqual({ ok: true, data: undefined });
    expect(mocks.deletePasswordResetsForUser).not.toHaveBeenCalled();
    expect(mocks.createPasswordReset).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('returns a generic failure on an unexpected error', async () => {
    mocks.findUserByEmail.mockRejectedValue(new Error('Database error'));

    expect(
      await forgotPasswordAction({
        email: 'test@example.com',
        turnstileToken: 'test-turnstile-token',
      })
    ).toEqual({
      ok: false,
      code: 'failed',
      error: 'Nie udało się przetworzyć żądania',
    });
  });
});
