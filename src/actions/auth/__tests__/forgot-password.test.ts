import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forgotPasswordAction } from '@/actions/auth/forgot-password';
import { AuthMethod } from '@/lib/auth/types/account';
import { expectNoPersonalData } from '@/lib/platform/logging/testing';

const mocks = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  replacePasswordReset: vi.fn(),
  sendPasswordResetEmail: vi.fn(() =>
    Promise.resolve({ ok: true, delivery: 'sent' })
  ),
  verifyTurnstileToken: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('next/server', () => ({
  after: (task: () => Promise<void>) => void task(),
}));
vi.mock('@/lib/users/queries/find-user-by-email', () => ({
  findUserByEmail: mocks.findUserByEmail,
}));
vi.mock('@/lib/auth/mutations/replace-password-reset', () => ({
  replacePasswordReset: mocks.replacePasswordReset,
}));
vi.mock('@/lib/platform/email/email-service', () => ({
  getEmailService: () => ({
    sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  }),
}));
vi.mock('@/lib/auth/rules/verification-tokens', () => ({
  generateSecureToken: () => 'test-token-123',
  hashToken: (token: string) => `hashed-${token}`,
}));
vi.mock('@/lib/auth/gateways/turnstile', () => ({
  verifyTurnstileToken: mocks.verifyTurnstileToken,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => mocks.log,
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

  it('treats a non-text email as missing', async () => {
    expect(
      await forgotPasswordAction({
        email: 42 as unknown as string,
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
    expect(mocks.replacePasswordReset).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('logs no e-mail address for unknown, OAuth and known accounts', async () => {
    await forgotPasswordAction({
      email: 'canary-unknown@example.com',
      turnstileToken: 't',
    });
    mocks.findUserByEmail.mockResolvedValue({
      ...CREDENTIALS_USER,
      email: 'canary-known@example.com',
    });
    await forgotPasswordAction({
      email: 'canary-known@example.com',
      turnstileToken: 't',
    });
    mocks.findUserByEmail.mockResolvedValue({
      ...CREDENTIALS_USER,
      email: 'canary-google@example.com',
      authMethod: AuthMethod.GOOGLE,
    });
    await forgotPasswordAction({
      email: 'canary-google@example.com',
      turnstileToken: 't',
    });

    expectNoPersonalData(Object.values(mocks.log), [
      'canary-unknown@example.com',
      'canary-known@example.com',
      'canary-google@example.com',
    ]);
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

    expect(mocks.replacePasswordReset).toHaveBeenCalledWith({
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
    expect(mocks.replacePasswordReset).not.toHaveBeenCalled();
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
