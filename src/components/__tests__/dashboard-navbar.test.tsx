import { render, screen } from '@testing-library/react';
import { describe, expect, it, type Mock, vi } from 'vitest';

import { DashboardNavbar } from '@/components/dashboard-navbar';
import { UserRole } from '@/lib/types';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('DashboardNavbar', () => {
  it('renders navbar with user email', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.user.findUnique as Mock).mockResolvedValue({
      email: 'test@example.com',
      role: UserRole.TENANT,
    });

    const Navbar = await DashboardNavbar({ userId: 'user-1' });
    render(Navbar as React.ReactElement);

    expect(screen.getByText('ATU Ekartoteka')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders admin panel button for admin users', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.user.findUnique as Mock).mockResolvedValue({
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    const Navbar = await DashboardNavbar({ userId: 'admin-1' });
    render(Navbar as React.ReactElement);

    expect(
      screen.getByRole('button', { name: /panel administratora/i })
    ).toBeInTheDocument();
  });

  it('does not render admin panel button for regular users', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.user.findUnique as Mock).mockResolvedValue({
      email: 'user@example.com',
      role: UserRole.TENANT,
    });

    const Navbar = await DashboardNavbar({ userId: 'user-1' });
    render(Navbar as React.ReactElement);

    expect(
      screen.queryByRole('button', { name: /panel administratora/i })
    ).not.toBeInTheDocument();
  });

  it('returns null if user not found', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.user.findUnique as Mock).mockResolvedValue(null);

    const Navbar = await DashboardNavbar({ userId: 'nonexistent' });
    expect(Navbar).toBeNull();
  });

  it('renders theme toggle and logout button', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.user.findUnique as Mock).mockResolvedValue({
      email: 'test@example.com',
      role: UserRole.TENANT,
    });

    const Navbar = await DashboardNavbar({ userId: 'user-1' });
    render(Navbar as React.ReactElement);

    expect(
      screen.getByRole('button', { name: /wyloguj/i })
    ).toBeInTheDocument();
  });
});
