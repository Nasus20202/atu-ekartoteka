import { describe, expect, it, vi } from 'vitest';

const { nextAuthConfigs, nextAuthResult } = vi.hoisted(() => {
  const nextAuthResult = {
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    unstable_update: vi.fn(),
  };
  return { nextAuthResult, nextAuthConfigs: [] as unknown[] };
});

vi.mock('next-auth', () => ({
  default: (config: unknown) => {
    nextAuthConfigs.push(config);
    return nextAuthResult;
  },
}));
vi.mock('@/lib/auth/config', () => ({ authConfig: { providers: [] } }));

import * as authModule from '@/auth';

describe('auth', () => {
  it('creates NextAuth from the app config', () => {
    expect(nextAuthConfigs).toEqual([{ providers: [] }]);
  });

  it('exposes the NextAuth helpers and the session update', () => {
    expect(authModule.handlers).toBe(nextAuthResult.handlers);
    expect(authModule.auth).toBe(nextAuthResult.auth);
    expect(authModule.signIn).toBe(nextAuthResult.signIn);
    expect(authModule.signOut).toBe(nextAuthResult.signOut);
    expect(authModule.update).toBe(nextAuthResult.unstable_update);
  });
});
