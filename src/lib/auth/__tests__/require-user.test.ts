import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireUser } from '@/lib/auth/require-user';

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock('@/auth', () => ({ auth: mockAuth }));

describe('requireUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the session of a signed-in user', async () => {
    const session = { user: { id: 'user-1', email: 'u@b.pl' } };
    mockAuth.mockResolvedValue(session);

    expect(await requireUser()).toEqual({ session });
  });

  it('returns 401 for an anonymous request', async () => {
    mockAuth.mockResolvedValue(null);

    const { response } = await requireUser();

    expect(response?.status).toBe(401);
  });

  it('returns 401 when the session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'u@b.pl' } });

    const { response } = await requireUser();

    expect(response?.status).toBe(401);
  });
});
