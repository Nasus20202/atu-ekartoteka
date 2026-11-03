import { describe, expect, it, vi } from 'vitest';

const mockAuth = vi.fn();

const mockConnection = vi.fn().mockResolvedValue(undefined);

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('next/server', () => ({ connection: mockConnection }));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T>(fn: T) => fn,
}));

const { getSession } = await import('@/lib/auth/get-session');

describe('getSession', () => {
  it('returns the session from auth()', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    await expect(getSession()).resolves.toEqual({ user: { id: 'user-1' } });
  });

  it('opts out of prerendering before reading the session', async () => {
    mockAuth.mockResolvedValue(null);

    await getSession();

    expect(mockConnection.mock.invocationCallOrder[0]).toBeLessThan(
      mockAuth.mock.invocationCallOrder.at(-1)!
    );
  });
});
