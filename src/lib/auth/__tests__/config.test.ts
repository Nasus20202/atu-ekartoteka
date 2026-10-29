import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogger, CredentialsSignin } = vi.hoisted(() => ({
  mockLogger: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  CredentialsSignin: class CredentialsSignin extends Error {},
}));

vi.mock('next-auth', () => ({ CredentialsSignin }));
vi.mock('@/lib/logger', () => ({ createLogger: () => mockLogger }));
vi.mock('@/lib/auth/providers', () => ({
  buildProviders: () => ['credentials'],
}));
vi.mock('@/lib/auth/callbacks', () => ({ callbacks: { jwt: vi.fn() } }));

import { callbacks } from '@/lib/auth/callbacks';
import { authConfig } from '@/lib/auth/config';

describe('authConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses JWT sessions, the login page, providers and callbacks', () => {
    expect(authConfig.session).toEqual({ strategy: 'jwt' });
    expect(authConfig.pages).toEqual({ signIn: '/login' });
    expect(authConfig.providers).toEqual(['credentials']);
    expect(authConfig.callbacks).toBe(callbacks);
  });

  it('does not log failed credential sign-ins as errors', () => {
    authConfig.logger?.error?.(new CredentialsSignin());

    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('logs other NextAuth errors', () => {
    const error = new Error('boom');

    authConfig.logger?.error?.(error);

    expect(mockLogger.error).toHaveBeenCalledWith({ error }, 'NextAuth error');
  });

  it('forwards warnings and debug messages to the logger', () => {
    authConfig.logger?.warn?.('debug-enabled');
    authConfig.logger?.debug?.('message', { a: 1 });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      { message: 'debug-enabled' },
      'NextAuth warning'
    );
    expect(mockLogger.debug).toHaveBeenCalledWith(
      { message: 'message', metadata: { a: 1 } },
      'NextAuth debug'
    );
  });
});
