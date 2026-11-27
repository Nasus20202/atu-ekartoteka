import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardChrome } from '@/components/navigation/dashboard-chrome';

const mockAuth = vi.fn();
const mockFindUser = vi.fn();
const mockCountAwaiting = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock('@/lib/framework/auth/get-session', () => ({
  getSession: () => mockAuth(),
}));

vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

vi.mock('@/lib/framework/rsc-cache', () => ({
  findUserByIdCached: (id: string) => mockFindUser(id),
}));

vi.mock('@/lib/voting/queries/count-awaiting-votings', () => ({
  countAwaitingVotings: (...args: unknown[]) => mockCountAwaiting(...args),
}));

vi.mock('@/lib/framework/request-now', () => ({
  getRequestNow: async () => new Date('2026-06-01T12:00:00Z'),
}));

vi.mock('@/components/navigation/dashboard-navbar', () => ({
  DashboardNavbar: ({
    isAdmin,
    pendingVotings,
  }: {
    isAdmin?: boolean;
    pendingVotings?: number;
  }) => (
    <nav
      data-admin={String(isAdmin)}
      data-pending-votings={String(pendingVotings)}
    />
  ),
}));

vi.mock('@/components/account/email-verification-banner', () => ({
  EmailVerificationBanner: () => null,
}));

vi.mock('@/components/account/orphaned-session-sign-out', () => ({
  OrphanedSessionSignOut: () => <div data-testid="orphaned-sign-out" />,
}));

async function renderChrome() {
  render(await DashboardChrome());
}

describe('DashboardChrome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountAwaiting.mockResolvedValue(2);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUser.mockResolvedValue({
      id: 'user-1',
      role: 'TENANT',
      status: 'APPROVED',
      emailVerified: true,
    });
  });

  it('redirects to login without a session', async () => {
    mockAuth.mockResolvedValue(null);

    await expect(renderChrome()).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('renders the navbar for an existing user', async () => {
    await renderChrome();

    expect(screen.getByRole('navigation')).toHaveAttribute(
      'data-admin',
      'false'
    );
    expect(screen.queryByTestId('orphaned-sign-out')).not.toBeInTheDocument();
  });

  it('shows admin navigation for an approved admin', async () => {
    mockFindUser.mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
      status: 'APPROVED',
      emailVerified: true,
    });

    await renderChrome();

    expect(screen.getByRole('navigation')).toHaveAttribute(
      'data-admin',
      'true'
    );
  });

  it('passes the count of votings waiting for an approved user', async () => {
    await renderChrome();

    expect(mockCountAwaiting).toHaveBeenCalledWith(
      'user-1',
      new Date('2026-06-01T12:00:00Z')
    );
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'data-pending-votings',
      '2'
    );
  });

  it('hides the votings link for an account that is not approved', async () => {
    mockFindUser.mockResolvedValue({
      id: 'user-1',
      role: 'TENANT',
      status: 'PENDING',
      emailVerified: true,
    });

    await renderChrome();

    expect(mockCountAwaiting).not.toHaveBeenCalled();
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'data-pending-votings',
      'undefined'
    );
  });

  it('signs out instead of rendering the navbar when the user was deleted', async () => {
    mockFindUser.mockResolvedValue(null);

    await renderChrome();

    expect(screen.getByTestId('orphaned-sign-out')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
