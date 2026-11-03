import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardChrome } from '@/components/navigation/dashboard-chrome';

const mockAuth = vi.fn();
const mockFindUser = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock('@/lib/auth/get-session', () => ({ getSession: () => mockAuth() }));

vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

vi.mock('@/lib/queries/users/find-user-by-id', () => ({
  findUserByIdCached: (id: string) => mockFindUser(id),
}));

vi.mock('@/components/navigation/dashboard-navbar', () => ({
  DashboardNavbar: ({ isAdmin }: { isAdmin?: boolean }) => (
    <nav data-admin={String(isAdmin)} />
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

  it('signs out instead of rendering the navbar when the user was deleted', async () => {
    mockFindUser.mockResolvedValue(null);

    await renderChrome();

    expect(screen.getByTestId('orphaned-sign-out')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
