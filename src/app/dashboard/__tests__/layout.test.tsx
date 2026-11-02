import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardLayout from '@/app/dashboard/layout';

const mockAuth = vi.fn();
const mockFindUser = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock('@/auth', () => ({ auth: () => mockAuth() }));

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

async function renderLayout() {
  render(await DashboardLayout({ children: <p>page content</p> }));
}

describe('DashboardLayout', () => {
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

    await expect(renderLayout()).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('renders the page for an existing user', async () => {
    await renderLayout();

    expect(screen.getByText('page content')).toBeInTheDocument();
    expect(screen.queryByTestId('orphaned-sign-out')).not.toBeInTheDocument();
  });

  it('signs out instead of rendering the page when the user was deleted', async () => {
    mockFindUser.mockResolvedValue(null);

    await renderLayout();

    expect(screen.getByTestId('orphaned-sign-out')).toBeInTheDocument();
    expect(screen.queryByText('page content')).not.toBeInTheDocument();
  });
});
