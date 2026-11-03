import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAccessGuard } from '@/components/navigation/admin-access-guard';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  hasAdminAccess: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth/get-session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: mocks.hasAdminAccess,
}));

describe('AdminAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mocks.hasAdminAccess.mockResolvedValue(true);
  });

  it('renders the admin pages for an approved admin', async () => {
    render(await AdminAccessGuard({ children: <p>admin page</p> }));

    expect(screen.getByText('admin page')).toBeInTheDocument();
    expect(mocks.hasAdminAccess).toHaveBeenCalledWith('admin-1');
  });

  it('redirects anonymous visitors to login without rendering the page', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(
      AdminAccessGuard({ children: <p>admin page</p> })
    ).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('redirects non-admins to the dashboard', async () => {
    mocks.hasAdminAccess.mockResolvedValue(false);

    await expect(
      AdminAccessGuard({ children: <p>admin page</p> })
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard');
  });
});
