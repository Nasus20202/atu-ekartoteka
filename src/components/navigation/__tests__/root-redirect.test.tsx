import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RootRedirect } from '@/components/navigation/root-redirect';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth/get-session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/queries/users/find-user-by-id', () => ({
  findUserByIdCached: mocks.findUser,
}));

describe('RootRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.findUser.mockResolvedValue({ role: 'TENANT' });
  });

  it('sends anonymous visitors to login', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(RootRedirect()).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('sends admins to the admin panel', async () => {
    mocks.findUser.mockResolvedValue({ role: 'ADMIN' });

    await expect(RootRedirect()).rejects.toThrow(
      'NEXT_REDIRECT:/admin/apartments'
    );
  });

  it('sends tenants to the dashboard', async () => {
    await expect(RootRedirect()).rejects.toThrow('NEXT_REDIRECT:/dashboard');
  });
});
