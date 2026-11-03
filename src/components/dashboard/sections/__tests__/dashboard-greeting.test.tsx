import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardGreeting } from '@/components/dashboard/sections/dashboard-greeting';

const mockLoadAccountUser = vi.fn();

vi.mock('@/app/dashboard/dashboard-loaders', () => ({
  loadAccountUser: () => mockLoadAccountUser(),
}));
vi.mock('@/components/account/orphaned-session-sign-out', () => ({
  OrphanedSessionSignOut: () => <div data-testid="orphaned-sign-out" />,
}));

describe('DashboardGreeting', () => {
  beforeEach(() => vi.clearAllMocks());

  it('greets the user by name with a fade-in', async () => {
    mockLoadAccountUser.mockResolvedValue({ name: 'Jan' });

    render(await DashboardGreeting());

    expect(screen.getByRole('heading', { name: 'Witaj, Jan!' })).toHaveClass(
      'motion-safe:animate-fade-in'
    );
  });

  it('greets an unnamed user without a comma', async () => {
    mockLoadAccountUser.mockResolvedValue({ name: null });

    render(await DashboardGreeting());

    expect(screen.getByRole('heading', { name: 'Witaj!' })).toBeInTheDocument();
  });

  it('signs out instead of redirecting when the user was deleted', async () => {
    mockLoadAccountUser.mockResolvedValue(null);

    render(await DashboardGreeting());

    expect(screen.getByTestId('orphaned-sign-out')).toBeInTheDocument();
  });
});
